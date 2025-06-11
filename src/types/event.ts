import { Score } from "./simulation";

export interface VisibleEvent {
	sportEventId: string;
	sport: string;
	competition: string;
	startTime: string;
	homeCompetitor: string;
	awayCompetitor: string;
	status: string;
	scores: Score[];
}

export interface InternalEvent extends VisibleEvent {
	removed?: boolean;
}
