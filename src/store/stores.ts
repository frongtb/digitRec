import { writable } from 'svelte/store'

export const predictionPercentage = writable({});
export const toggleGraph = writable(false);
export const togglePredicted = writable(false);