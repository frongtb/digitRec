<script lang="ts">
	import Canvas from './Canvas.svelte';
	import PercentageGraph from './PercentageGraph.svelte';
	import PredictedDigit from './PredictedDigit.svelte';
	import { predictionPercentage, toggleGraph, togglePredicted } from './store/stores.ts';
</script>

<head>
  	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css">
</head>

<main id="homepage">
	
	<Canvas/>
	{#if $togglePredicted}
		<PredictedDigit/>
	{/if}
	{#if $toggleGraph}
		<PercentageGraph/>
	{/if}
</main>

<style>
#homepage{
position: relative;
width: 100%;
height: 1024px;
background: #606060;
mix-blend-mode: normal;
box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
</style>