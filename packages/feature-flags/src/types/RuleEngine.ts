import type { TimeActionKeys } from '../constants.js';

/** Identifies an Action that reads the clock instead of caller context. @internal */
type TimeAction = keyof typeof TimeActionKeys;

/** Carries validated bounds for a schedule Action. @internal */
type TimeRange = { START: string; END: string; TIMEZONE?: string };

/** Carries validated day names for a schedule Action. @internal */
type DaysOfWeek = { DAYS: string[]; TIMEZONE?: string };

/** Carries validated integer bounds for a modulo Action. @internal */
type ModuloRange = { BASE: number; START: number; END: number };

export type { DaysOfWeek, ModuloRange, TimeAction, TimeRange };
