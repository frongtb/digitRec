<script lang="ts">
	import Canvas from './Canvas.svelte';
	import { predictionPercentage, toggleGraph } from './store/stores.ts';

  $: predictedAnswer = Object.keys($predictionPercentage).reduce((a, b) => $predictionPercentage[a] > $predictionPercentage[b] ? a : b, {});

  function onGraphBtnClick() {
    toggleGraph.update(value => !value)
  }
  
</script>

<main>
  <div id="box">
  <h1 id="predictProduct">{predictedAnswer}</h1></div>
  <button on:click={onGraphBtnClick} id="ButtonGraph">graph</button>
</main>

<style>
  #box{
    position:relative;
  }
#ButtonGraph{
position: fixed;
width: 9%;
height: 8%;
left: 65%;
top: 83%;
background: #B1C319;
}
#predictProduct{
 position: fixed;
 left: 68%;
 top: 50%;
 font-family: FC Daisy;
 font-style: normal;
 font-weight: normal;
 font-size: 400%;
 line-height: 171px;
 text-align: center;
 color: #FFFFFF;
}
</style>