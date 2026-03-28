const pinyinTxt = [
  1.5,
  ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q'],
  ['x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'],
  ['a', 'o', 'e', 'i', 'u', 'ü'],
  ['ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er'],
  ['an', 'en', 'in', 'un', 'ün'],
  ['ang', 'eng', 'ing', 'ong'],
  ['zhi', 'chi', 'shi', 'ri', 'zi', 'ci', 'si', 'yi', 'wu'],
  ['yu', 'ye', 'you', 'yuan', 'yin', 'yun', 'ying'],
]

let k = 0
let htmlSpns = ''
let spns = ''
let htmlInpts = ''
let inpts = ''
let html = ''
let htmlDiv = ''
const intrvl = parseFloat(pinyinTxt.shift())
const tmpNumArr = []
const tmpStrArr = []
const times = []
let indx = 0
const lesson = {}
lesson.sprite = {}
lesson.sprite.src = ''
lesson.sprite.names = {}

class Sprite {
  constructor(settingsObj) {
    this.src = settingsObj.src
    this.names = settingsObj.names

    this.init()
  }
  async init() {
    const AudioCtx = new AudioContext()
    this.ctx = AudioCtx
    this.audioBuffer = await this.getFile(this.src)
    this.gain1 = this.ctx.createGain()
    this.gain1.gain.value = 0.6

    this.gain1.connect(this.ctx.destination)
  }
  async getFile(src) {
    $('.spinner').show()
    const response = await fetch(src)
    if (!response.ok) {
      console.log(`${response.url} ${response.status}`)
      throw new Error(
        `Failed to fetch audio file: ${response.url} ${response.status}`,
      )
    }
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer)
    $('.spinner').hide()
    $('#startPlay').show('slow')
    return audioBuffer
  }

  play(name) {
    if (this.source) {
      //Prevents overlap
      try {
        this.source.stop()
      } catch { }
    }
    console.log('start Playing')
    if (this.audioBuffer) {
      const bufferSource = this.ctx.createBufferSource()
      bufferSource.buffer = this.audioBuffer
      this.source = bufferSource

      const [strt, dur] = this.names[name]
      this.offset = 0
      this.strt = strt
      this.dur = dur

      bufferSource.connect(this.gain1)
      bufferSource.start(this.offset, this.strt, this.dur)
      this.source.onended = () => {
        console.log(83, this.isStopped)
        if (this.isStopped) {
          this.isStopped = false
          return
        }
        if (lesson.nonStop) {
          let playElm = elmToFocus()
          $(playElm).val(playElm.data('val')).addClass('pld')
          lesson.indxToPlay.shift()
          if (lesson.indxToPlay.length === 0) {
            restorIndxToPlay()
            return
          }
          playElm = elmToFocus()
          playElm.focus()
          // $(playElm).removeClass('pld').val('')

        }
        this.isStopped = false
      }
    } else {
      console.log('Audio not loaded yet')
    }
  }
  stop() {
    if (this.source) {
      this.source.stop()
      this.source.disconnect()
      this.source = null
      this.isStopped = true
    }
  }
  reset() {
    this.offset = 0
    this.strt = this.s1
    this.dur = this.d1
  }
}

pinyinTxt.forEach((row, index) => {
  htmlDiv = htmlDiv + `<div class="row" data-row="${index}">`
  htmlSpns = `<p class="spns" data-row="${index}">`
  const checkParagraph = `<input type="checkbox" class="checkPar" checked="checked" data-row="${index}">`
  htmlInpts = `<p class="inpts" data-row="${index}">` + checkParagraph
  spns = ''
  inpts = ''
  row.forEach((strng, i) => {
    tmpNumArr.push(k)
    tmpStrArr.push(strng)
    $('#widthMesure').text(strng)
    const wdth = $('#widthMesure').width()
    spns += `<span data-indx="${k}" style="width: ${wdth + 10}px;">${strng}</span>`
    inpts += `<input type="text" class="inpts" data-indx="${k}" data-val="${strng}" style="width: ${wdth + 10}px;">`
    const strt = intrvl * k
    const dur = intrvl
    // times.push({ strt, dur })
    const key = `k_${k}`
    lesson.sprite.names[strng] = []
    lesson.sprite.names[strng].push(strt, dur)
    k++
  })
  htmlDiv += htmlSpns + spns + '</p>' + htmlInpts + inpts + '</p>' + '</div>'
})

lesson.sprite.src = './pinyinSounds.mp3'
const sprite = new Sprite(lesson.sprite)

// const gain = sprite.gain1 // your GainNode
const volmBr = document.getElementById('volBar')
const level = document.getElementById('volLevel')
const volmIcn = document.getElementById('volIcon')

let lastVolume = sprite.gain1 ? sprite.gain1.gain.value : 1
// gain.gain.value = lastVolume

$(volmBr).on('click', (e) => {
  const rect = volmBr.getBoundingClientRect()
  const x = e.clientX - rect.left
  const volume = x / rect.width

  sprite.gain1.gain.value = volume
  lastVolume = volume

  updateUI()
})

$(volmIcn).on('click', () => {
  if (sprite.gain1.gain.value > 0) {
    lastVolume = sprite.gain1.gain.value
    sprite.gain1.gain.value = 0
  } else {
    sprite.gain1.gain.value = lastVolume
  }
  updateUI()
})

function updateUI() {
  const vol = sprite.gain1.gain.value
  level.style.width = vol * 100 + '%'

  if (vol < 0.01) {
    volmIcn.textContent = '🔇'
  } else if (vol < 0.5) {
    volmIcn.textContent = '🔉'
  } else {
    volmIcn.textContent = '🔊'
  }
}

const checkForAll = `<input type="checkbox" id="forAll" checked="checked">`
htmlDiv = checkForAll + htmlDiv
$('#spnsInpts').append(htmlDiv)
lesson.indxToPlay = tmpNumArr
lesson.strngToPlay = tmpStrArr
lesson.times = times
lesson.currntIndx = lesson.indxToPlay[0]
lesson.currntName = lesson.strngToPlay[0]
// $(`#spnsInpts p.inpts input.inpts[data-indx="${lesson.currntIndx}"]`).focus()

$('#coffeeBreak').on('click', function () {
  lesson.nonStop = false
  setTimeout(() => {
    $('#loop').show('slow')
    $('[for="loop"]').show('slow')
  }, 1000)
  $('#loop').prop('checked', false)
  $('#coffeeBreak').hide('slow')
})

function elmToFocus() {
  return $(`input.inpts[data-indx="${lesson.indxToPlay[0]}"]`)
}

$('#spnsInpts').on('change', "input[type='checkbox']", function () {
  const indx = lesson.currntIndx
  $('#confrmChange').show('slow')
  lesson.confirmed = false
  const checked = $(this).prop('checked')
  if ($(this).attr('id') === 'forAll') {
    if (checked) {
      $('.checkPar').prop('checked', true)
      $('input.inpts').removeClass('off').removeClass('pld')
      $('input.inpts').val('')
    } else {
      $('.checkPar').prop('checked', false)
      $('input.inpts').removeClass('pld').addClass('off')
      $('input.inpts').val('')
    }
  } else {
    const inpts = $(this)
      .siblings('input.inpts')
      .removeClass('off')
      .removeClass('pld')
    if (checked) {
      inpts.val('')
    } else {
      inpts.val('').addClass('off')
    }
  }
})

$('#spnsInpts').on('click', 'p.spns span', function (e) {
  e.stopPropagation()
  const indx = $(this).data('indx')
  const inpt = $(`input.inpts[data-indx="${indx}"]`)
  $(inpt).val('').removeClass('pld')
  $(inpt).not('.off').length > 0
    ? inpt.addClass('off')
    : inpt.removeClass('off')
  $('#confrmChange:hidden') ? $('#confrmChange').show('slow') : null
  lesson.confirmed = false
})

$('#spnsInpts').on('click', '#confrmChange', function (e) {
  sprite.stop()
  $('#confrmChange').hide('slow')
  lesson.confirmed = true
  if (lesson.indxToPlay.length <= 0) {
    restorIndxToPlay()
  }
  let inptsOn = $('input.inpts').not('.pld').not('.off')
  console.log(inptsOn)
  if (inptsOn.length === 0) {
    elmToFocus().siblings().removeClass('pld')
    inptsOn = $('input.inpts').not('.pld').not('.off')
  }
  if (inptsOn.length === 0) {
    $('#confrmChange').hide('slow')
    lesson.confirmed = true
    $('#confrmChange').show('slow')
    lesson.confirmed = false
    $('#spnsInpts checkbox').prop('checked', false)
  } else {
    lesson.indxToPlay = []
    const checkboxes = $('.checkPar')
    let k = 0
    $(checkboxes).each((i, elem) => {
      const length = $(elem).siblings('.inpts').not('.off').length
      if (length === 0) {
        $(elem).prop('checked', false)
      } else {
        $(elem).prop('checked', true)
        k++
      }
    })
    $(inptsOn).each((i, inpt) => {
      const indx = $(inpt).data('indx')
      lesson.indxToPlay.push(indx)
    })
    if (inptsOn.length > 0) {
      $('#forAll').prop('checked', true)
    }
    elmToFocus().focus()
    elmToFocus().removeClass('pld').val('')
  }
  if (lesson.random) {
    lesson.indxToPlay.sort(() => Math.random() - 0.5)
  } else {
    lesson.indxToPlay.sort((a, b) => a - b)
  }
})
$('#spnsInpts').on('focus', "input[type='text']", function (e) {
  lesson.currntName = $(this).data('val')
  lesson.currntIndx = $(this).data('indx')
  $('#flashSpan').text('')
  if (lesson.nonStop) {
    if (sprite.isStopped === true) {
      setTimeout(() => {
        sprite.isStopped = false
      }, 50)
    }
  }
  sprite.play(lesson.currntName)
})

$('#spnsInpts').on('blur', "input[type='text']", function (e) {
})

$('#spnsInpts').on('input', "input[type='text']", function () {
  if (!lesson.confirmed) {
    $('#confrmChange').hide('slow')
    $('#confrmChange').show('slow')
    $(this).val('')
    return
  }
  const val = $(this).val()
  $('#flashSpan').text(val)
  if (val === lesson.currntName) {
    $(this).addClass('pld')
    lesson.indxToPlay.shift()
    if (lesson.indxToPlay.length === 0) {
      restorIndxToPlay()
    }
    elmToFocus().focus()
    elmToFocus().removeClass('pld').val('')
    $('.flash').eq(0).text(val)
  }
})

$('#spnsInpts').on('keydown', 'input[type="text"]', function (e) {

  if (e.key === 'Enter') {
    const strng = $(this).val()
    sprite.play(lesson.currntName)
  } else if (e.key === ' ') {
    $(this).val('')
  }
})

$('fieldset.control').on('change', '[type="checkbox"]', function () {
  sprite.stop()
  const id = this.id
  const checked = $(this).prop('checked')
  const playElm = elmToFocus()
  $(playElm).val(playElm.data('val'))
  console.log(id);
  if (id === 'hideAll') {
    if (!checked) {
      $('p.spns').removeClass('invisible')
    } else {
      $('p.spns').addClass('invisible')
    }
  } else if (id === 'flashCard') {
    if (checked) {
      $('#coverPlayground').show('slow')
      $('.flash').text('')
    } else {
      $('#coverPlayground').hide('slow')
    }
  } else if (id === 'random') {
    lesson.random = checked
    if (checked) {
      lesson.indxToPlay.sort(() => Math.random() - 0.5)
    } else {
      lesson.indxToPlay.sort((a, b) => a - b)
    }
  } else if (id === 'loop') {
    lesson.nonStop = checked
    if (checked) {
      // $('#coffeeBreak').show('slow')
      $(playElm).val(playElm.data('val')).addClass('pld')
    }
  }
  playElm.focus()
  $(playElm).removeClass('pld').val('')
})

function restorIndxToPlay() {
  lesson.indxToPlay = []
  const inptOns = $('input.inpts').not('.off')
  $(inptOns).removeClass('pld').val('')
  $(inptOns).each((i, inpt) => {
    const indx = $(inpt).data('indx')
    lesson.indxToPlay.push(indx)
  })
  if (lesson.random) {
    lesson.indxToPlay.sort(() => Math.random() - 0.5)
  } else {
    lesson.indxToPlay.sort((a, b) => a - b)
  }
  const indx = lesson.indxToPlay[0]
  playElm = elmToFocus()
  playElm.focus()
  $(playElm).removeClass('pld').val('')
  if (lesson.nonStop) {
    $(playElm).val(playElm.data('val')).addClass('pld')
  }
}

$('#startPlay').on('click', async function (e) {
  e.stopPropagation()
  if (sprite.ctx.state === 'suspended') {
    await sprite.ctx.resume()
  }
  setTimeout(() => {
    $('#loop').show('slow')
    $('[for="loop"]').show('slow')
  }, 1000)
  $('#loop').prop('checked', false)
  $('#audioLoad').hide('slow', function () {
    lesson.confirmed = true
    elmToFocus().focus()
  })
})
