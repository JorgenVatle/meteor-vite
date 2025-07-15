import { formatDistance } from 'date-fns';
import type { FormatDistanceOptions } from 'date-fns/formatDistance';
import { GlobalState } from '../GlobalState';

export function formatRelativeTime(date: Date, options: FormatDistanceOptions = {}): string {
    return formatDistance(date, GlobalState.currentTime, Object.assign({
        addSuffix: true,
    }, options));
}