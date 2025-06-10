export interface Score {
	periodId: string;
	home: string;
	away: string;
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
