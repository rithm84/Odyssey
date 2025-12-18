import * as chrono from 'chrono-node';

export interface ParsedDate {
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  confidence: 'high' | 'medium' | 'low';
}

export function parseEventDate(
  dateString: string,
  timeString?: string,
  durationString?: string
): ParsedDate {
  const fullString = timeString 
    ? `${dateString} at ${timeString}` 
    : dateString;
  
  const parsed = chrono.parse(fullString, new Date(), { forwardDate: true });
  const result = parsed[0];
  
  if (!result) {
    return {
      date: null,
      startTime: null,
      endTime: null,
      confidence: 'low'
    };
  }

  const startTime = result.start.date();
  
  let endTime: Date | null = null;
  if (result.end) {
    endTime = result.end.date();
  } else if (durationString) {
    const durationParsed = chrono.parse(`${startTime.toISOString()} for ${durationString}`);
    const durationResult = durationParsed[0];
    
    if (durationResult?.end) {
      endTime = durationResult.end.date();
    }
  }

  return {
    date: startTime,
    startTime,
    endTime,
    confidence: result.start.isCertain('day') ? 'high' : 'medium'
  };
}
