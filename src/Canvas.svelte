<script lang="ts">
  import { onMount } from 'svelte'
  import { predictionPercentage, toggleGraph, togglePredicted } from './store/stores.ts'

  let canvas
  let clearBtn
  let predictBtn
  let flag = false
  let prevX = 0
  let currX = 0
  let prevY = 0
  let currY = 0
  let dot_flag = false

  let x = 'white'
  let y = 30

  onMount(() => {
    const ctx = canvas.getContext('2d')
    const width = ctx.canvas.clientWidth
    const height = ctx.canvas.clientHeight

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = 'white'
    ctx.lineCap = 'round'

    canvas.addEventListener(
      'mousemove',
      function (e) {
        findxy('move', e)
      },
      false,
    )
    canvas.addEventListener(
      'mousedown',
      function (e) {
        findxy('down', e)
      },
      false,
    )
    canvas.addEventListener(
      'mouseup',
      function (e) {
        findxy('up', e)
      },
      false,
    )
    canvas.addEventListener(
      'mouseout',
      function (e) {
        findxy('out', e)
      },
      false,
    )

    function draw() {
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(currX, currY)
      ctx.strokeStyle = x
      ctx.lineWidth = y
      ctx.stroke()
      ctx.closePath()
    }

    function findxy(res, e) {
      if (res == 'down') {
        prevX = currX
        prevY = currY
        currX = e.clientX - canvas.offsetLeft
        currY = e.clientY - canvas.offsetTop

        flag = true
        dot_flag = true
        if (dot_flag) {
          ctx.beginPath()
          ctx.fillStyle = x
          ctx.fillRect(currX, currY, 2, 2)
          ctx.closePath()
          dot_flag = false
        }
      }
      if (res == 'up' || res == 'out') {
        flag = false
      }
      if (res == 'move') {
        if (flag) {
          prevX = currX
          prevY = currY
          currX = e.clientX - canvas.offsetLeft
          currY = e.clientY - canvas.offsetTop
          draw()
        }
      }
    }

    clearBtn.addEventListener(
      'click',
      function (e) {
        erase()
      },
      false,
    )

    function erase() {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = 'white'

      predictionPercentage.set({})
      toggleGraph.set(false)
      togglePredicted.set(false)
    }

    predictBtn.addEventListener(
      'click',
      function (e) {
        predict()
      },
      false,
    )

    function predict() {
      canvas.toBlob(function (blob) {
        const formData = new FormData()
        formData.append('file', blob)

        const res = fetch('http://127.0.0.1:8000/model_v1/predict', {
          method: 'POST',
          body: formData,
        })
          .then((res) => {
            return res.json()
          })
          .then((data) => {
            const predictions = JSON.parse(data)
            for (let key in predictions) {
              if (predictions.hasOwnProperty(key)) {
                predictions[key] = parseFloat(predictions[key])
              }
            }

            predictionPercentage.update((value) => predictions)
            togglePredicted.set(true)
          })
      })
    }
  })
</script>

<main id="pagePrediction">
<div id="tabbar">
<h1 id="handWrite">Handwritten Digit Recognition Web App</h1>
<p id="writenum">Write your number!</p>
<p id="predictionResult">Prediction Result</p>
<p id="arrowbody"></p>

<p id="accuracy">Accuracy: xx%</p>
<canvas bind:this={canvas} width="400" height="400" id="canvasW"/>
<div>
<div> 
  <button bind:this={clearBtn} id="ButtonClear">clear</button>
  <button bind:this={predictBtn} id="ButtonPredict">predict</button>
<div>
</main>

<style>
#pagePrediction{
background-size: 100% 100%;
position: relative;

background: #606060;
mix-blend-mode: normal;
}
#tabbar{
position: absolute;
width: 1440px;
height: 140px;
left: 0px;
top: 0px;
background: #B1C319;
}
#handWrite{
position: absolute;
width: 1360px;
height: 100px;
left: 36px;
top: 32px;
font-family: Roboto;
font-style: normal;
font-weight: normal;
font-size: 64px;
line-height: 75px;
text-align: center;
color: #FFFFFF;
}
#ButtonPredict
{position: absolute;
  width: 200px;
  height: 80px;
  left: 120px;
  top: 816px;
  background: #B1C319;
  }
#ButtonClear{
position: absolute;
width: 200px;
height: 80px;
left: 340px;
top: 816px;
background: #B1C319;
}

#canvasW{
position: absolute;
width: 460px;
height: 460px;
left:100px;
top: 316px;
}
#writenum{
position: absolute;
width: 500px;
height: 106px;
left: 80px;
top: 200px;

font-family: FC Daisy;
font-style: normal;
font-weight: normal;
font-size: 50px;

line-height: 95px;
text-align: center;
color: #FFFFFF;
}

#predictionResult{
position:absolute;
width: 380px;
height: 60px;
left: 909px;
top: 384px;
font-family: Roboto;
font-style: normal;
font-weight: bold;
font-size: 48px;
line-height: 56px;
text-align: center;
color: #FFFFFF;
}
#accuracy{
position: absolute;
width: 380px;
height: 60px;
left: 920px;
top: 650px;
font-family: Roboto;
font-style: normal;
font-weight: normal;
font-size: 36px;
line-height: 42px;
text-align: center;
color: #FFFFFF;
}
#arrowbody{
position: absolute;
width: 180px;
height: 0px;
left: 640px;
top: 560px;
border: 5px solid #FFFFFF;
box-sizing: border-box;
}

</style>


