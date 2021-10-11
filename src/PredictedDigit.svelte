<script lang="ts">
	import Canvas from './Canvas.svelte';
	import { predictionPercentage, toggleGraph } from './store/stores.ts';

  $: predictedAnswer = Object.keys($predictionPercentage).reduce((a, b) => $predictionPercentage[a] > $predictionPercentage[b] ? a : b, {});

  function onGraphBtnClick() {
    toggleGraph.update(value => !value)
  }
  
</script>

<main>
  <h1 id="predictProduct">{predictedAnswer}</h1>
  <button on:click={onGraphBtnClick} id="ButtonGraph">graph</button>
</main>

<style>
#ButtonGraph{
position: absolute;
width: 200px;
height: 80px;
left: 1010px;
top: 720px;
background: #B1C319;
}
#predictProduct{
position: absolute;
width: 101px;
height: 180px;
left: 1059px;
top: 454px;
font-family: FC Daisy;
font-style: normal;
font-weight: normal;
font-size: 100px;
line-height: 171px;
text-align: center;
color: #FFFFFF;
}
</style>