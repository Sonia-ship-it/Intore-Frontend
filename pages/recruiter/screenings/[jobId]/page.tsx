import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { RecruiterLayout } from '@/components/layout/RecruiterLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, RefreshCw, Users, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';

interface ScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  projectsAndCerts: number;
  availability: number;
}

interface ScreenedCandidate {
  candidateIndex: number;
  name: string;
  rank: number;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  reasoning?: string;
  finalVerdict: "Strong Hire" | "Hire" | "Consider" | "Borderline";
}

interface ScreeningResult {
  _id: string;
  jobId: string;
  shortlist: ScreenedCandidate[];
  screeningSummary: string;
  createdAt: string;
  totalCandidatesEvaluated: number;
  shortlistSize: number;
}

export default function ScreeningResultsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const { toast } = useToast();
  
  const [screening, setScreening] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [shortlistSize, setShortlistSize] = useState<10 | 20>(10);
  const [jobTitle, setJobTitle] = useState<string>('');

  useEffect(() => {
    if (jobId) {
      fetchScreeningResults();
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchScreeningResults = async () => {
    try {
      setLoading(true);
      const response = await apiFetch<{ success: boolean; data?: ScreeningResult[] }>(`/api/screenings/${jobId}`);
      if (response.success && response.data && response.data.length > 0) {
        // Get the most recent screening
        const latestScreening = response.data[0];
        setScreening(latestScreening);
        setShortlistSize(latestScreening.shortlistSize as 10 | 20);
      } else {
        toast({
          title: 'No screening results found',
          description: 'Run an AI screening for this job to see results.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to load screening results',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async () => {
    try {
      const response = await apiFetch(`/jobs/${jobId}`);
      if (response.title) {
        setJobTitle(response.title);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    }
  };

  const handleExportCSV = () => {
    if (!screening) return;

    const headers = [
      'Rank', 'Name', 'Match Score', 'Final Verdict', 'Skills Score', 'Experience Score',
      'Education Score', 'Projects & Certs Score', 'Availability Score', 'Strengths', 'Gaps', 'Recommendation'
    ];

    const csvContent = [
      headers.join(','),
      ...screening.shortlist.map(candidate => [
        candidate.rank,
        `"${candidate.name}"`,
        candidate.matchScore,
        `"${candidate.finalVerdict}"`,
        candidate.scoreBreakdown.skills,
        candidate.scoreBreakdown.experience,
        candidate.scoreBreakdown.education,
        candidate.scoreBreakdown.projectsAndCerts,
        candidate.scoreBreakdown.availability,
        `"${candidate.strengths.join('; ')}"`,
        `"${candidate.gaps.join('; ')}"`,
        `"${candidate.recommendation.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screening-results-${jobId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReRunScreening = () => {
    // This would open a modal or navigate to the job page with screening modal
    router.push(`/recruiter/jobs/${jobId}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Strong Hire': return 'bg-green-700 text-white';
      case 'Hire': return 'bg-green-600 text-white';
      case 'Consider': return 'bg-amber-600 text-white';
      case 'Borderline': return 'bg-gray-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading screening results...</p>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  if (!screening) {
    return (
      <RecruiterLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Screening Results</h2>
            <p className="text-muted-foreground mb-6">
              Run an AI screening for this job to see candidate rankings and recommendations.
            </p>
            <Button onClick={() => router.push(`/recruiter/jobs/${jobId}`)}>
              Go to Job Page
            </Button>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{jobTitle}</h1>
              <p className="text-muted-foreground">AI Screening Results</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleReRunScreening}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-run Screening
            </Button>
            <div className="flex items-center border rounded-lg">
              <Button
                variant={shortlistSize === 10 ? "default" : "ghost"}
                size="sm"
                onClick={() => setShortlistSize(10)}
                className="rounded-r-none"
              >
                Top 10
              </Button>
              <Button
                variant={shortlistSize === 20 ? "default" : "ghost"}
                size="sm"
                onClick={() => setShortlistSize(20)}
                className="rounded-l-none"
              >
                Top 20
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Banner */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Candidates Evaluated</p>
                    <p className="text-2xl font-bold text-blue-900">{screening.totalCandidatesEvaluated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Top {shortlistSize} Shortlisted</p>
                    <p className="text-2xl font-bold text-green-900">
                      {screening.shortlist.slice(0, shortlistSize).length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Avg Match Score</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {Math.round(
                        screening.shortlist
                          .slice(0, shortlistSize)
                          .reduce((sum, c) => sum + c.matchScore, 0) / 
                          Math.min(shortlistSize, screening.shortlist.length)
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right max-w-md">
                <p className="text-sm text-blue-600 font-medium mb-2">AI Summary</p>
                <p className="text-sm text-blue-900 leading-relaxed">{screening.screeningSummary}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Cards */}
        <div className="space-y-4">
          {screening.shortlist.slice(0, shortlistSize).map((candidate) => (
            <Card key={candidate.candidateIndex} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full font-bold text-lg">
                      #{candidate.rank}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{candidate.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getVerdictColor(candidate.finalVerdict)}>
                          {candidate.finalVerdict}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Overall Match: {candidate.matchScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold mb-1">{candidate.matchScore}%</div>
                    <Progress 
                      value={candidate.matchScore} 
                      className="w-24 h-2"
                      // @ts-ignore
                      style={{ 
                        '--progress-background': getScoreProgressColor(candidate.matchScore) 
                      } as React.CSSProperties}
                    />
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Skills</div>
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={candidate.scoreBreakdown.skills} max={40} className="flex-1 h-2" />
                      <span className="text-xs font-medium w-8">{candidate.scoreBreakdown.skills}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Experience</div>
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={candidate.scoreBreakdown.experience} max={30} className="flex-1 h-2" />
                      <span className="text-xs font-medium w-8">{candidate.scoreBreakdown.experience}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Education</div>
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={candidate.scoreBreakdown.education} max={15} className="flex-1 h-2" />
                      <span className="text-xs font-medium w-8">{candidate.scoreBreakdown.education}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Projects</div>
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={candidate.scoreBreakdown.projectsAndCerts} max={10} className="flex-1 h-2" />
                      <span className="text-xs font-medium w-8">{candidate.scoreBreakdown.projectsAndCerts}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Availability</div>
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={candidate.scoreBreakdown.availability} max={5} className="flex-1 h-2" />
                      <span className="text-xs font-medium w-8">{candidate.scoreBreakdown.availability}</span>
                    </div>
                  </div>
                </div>

                {/* Strengths and Gaps */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-green-700 mb-2">Strengths</div>
                    <div className="flex flex-wrap gap-1">
                      {candidate.strengths.map((strength, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-amber-700 mb-2">Areas for Improvement</div>
                    <div className="flex flex-wrap gap-1">
                      {candidate.gaps.map((gap, index) => (
                        <Badge key={index} variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">AI Recommendation</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{candidate.recommendation}</p>
                </div>

                {/* AI Reasoning */}
                {candidate.reasoning && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <div className="text-sm font-medium text-blue-700">AI Analysis & Reasoning</div>
                    </div>
                    <div className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">
                      {candidate.reasoning}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RecruiterLayout>
  );
}
