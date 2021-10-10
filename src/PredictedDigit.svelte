<script lang="ts">
	import Canvas from './Canvas.svelte';
	import { predictionPercentage, toggleGraph } from './store/stores.ts';

  $: predictedAnswer = Object.keys($predictionPercentage).reduce((a, b) => $predictionPercentage[a] > $predictionPercentage[b] ? a : b, {});

  function onGraphBtnClick() {
    toggleGraph.update(value => !value)
  }
  
</script>

<main>
  <h1>{predictedAnswer}</h1>
  <button on:click={onGraphBtnClick}>graph</button>
</main>

<style>

</style>