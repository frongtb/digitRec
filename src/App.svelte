<script lang="ts">
	import Canvas from './Canvas.svelte';
	import PercentageGraph from './PercentageGraph.svelte';
	import PredictedDigit from './PredictedDigit.svelte';
	import { predictionPercentage, toggleGraph, togglePredicted } from './store/stores.ts';
</script>

<head>
  	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css">
</head>

<main>
	<Canvas/>
	{#if $togglePredicted}
		<PredictedDigit/>
	{/if}
	{#if $toggleGraph}
		<PercentageGraph/>
	{/if}
</main>

<style>

</style>