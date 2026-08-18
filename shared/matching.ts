export type MatchableJob = {
  id: number;
  title: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
};

export type MatchableCandidate = {
  desiredJobTitle: string;
  preferredLocation: string;
  expectedSalary: number;
  yearsExperience: number;
  noticePeriodDays: number;
  skills?: string[];
};

export type JobMatch = {
  jobId: number;
  score: number;
  reasons: string[];
};

function words(value: string) {
  return new Set(
    value
      .toLocaleLowerCase()
      .split(/[^A-Za-z0-9\u0600-\u06FF+#.]+/)
      .map(word => word.trim())
      .filter(word => word.length > 1),
  );
}

function hasOverlap(left: Set<string>, right: Set<string>) {
  return Array.from(left).some(word => right.has(word));
}

export function calculateJobMatches(candidate: MatchableCandidate, jobs: MatchableJob[]): JobMatch[] {
  const desiredTitleWords = words(candidate.desiredJobTitle);
  const preferredLocation = candidate.preferredLocation.trim().toLocaleLowerCase();
  const candidateSkills = new Set((candidate.skills ?? []).map(skill => skill.trim().toLocaleLowerCase()));

  return jobs
    .map(job => {
      let score = 0;
      const reasons: string[] = [];
      const jobTitleWords = words(job.title);
      const jobDescriptionWords = words(job.description);
      const titleOverlap = hasOverlap(desiredTitleWords, jobTitleWords);
      const exactTitle = job.title.trim().toLocaleLowerCase() === candidate.desiredJobTitle.trim().toLocaleLowerCase();
      const jobLocation = job.location.trim().toLocaleLowerCase();
      const locationOverlap = Boolean(preferredLocation && (jobLocation === preferredLocation || jobLocation.includes("remote") || jobLocation.includes("عن بُعد")));

      if (exactTitle) {
        score += 42;
        reasons.push("title_exact");
      } else if (titleOverlap) {
        score += 26;
        reasons.push("title_similar");
      }

      if (preferredLocation && jobLocation === preferredLocation) {
        score += 20;
        reasons.push("location_match");
      } else if (preferredLocation && (jobLocation.includes("remote") || jobLocation.includes("عن بُعد"))) {
        score += 14;
        reasons.push("remote_available");
      }

      if (candidate.expectedSalary <= job.salaryMax) {
        score += candidate.expectedSalary >= job.salaryMin ? 22 : 17;
        reasons.push("salary_match");
      } else if (candidate.expectedSalary <= Math.round(job.salaryMax * 1.1)) {
        score += 8;
        reasons.push("salary_close");
      }

      const overlappingSkills = Array.from(candidateSkills).filter(skill => jobDescriptionWords.has(skill));
      if (overlappingSkills.length > 0) {
        score += Math.min(12, overlappingSkills.length * 4);
        reasons.push(`skills:${overlappingSkills.slice(0, 3).join(",")}`);
      }

      if (candidate.yearsExperience > 0) {
        score += Math.min(4, candidate.yearsExperience);
      }
      if (candidate.noticePeriodDays <= 30) {
        score += 3;
      }

      const hasCoreSignal = titleOverlap || locationOverlap || overlappingSkills.length > 0;
      return { jobId: job.id, score: hasCoreSignal ? Math.min(100, score) : 0, reasons };
    })
    .filter(match => match.score >= 25)
    .sort((a, b) => b.score - a.score);
}
