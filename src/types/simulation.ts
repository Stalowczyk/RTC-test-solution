export interface Score {
	competitorId: string;
	score: string;
}

export interface SimulationData {
	sportEventId: string;
	sportId: string;
	competitionId: string;
	startTime: string;
	homeCompetitorId: string;
	awayCompetitorId: string;
	sportEventStatusId: string;
	scores: Score[];
}
