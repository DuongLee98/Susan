const socket = io.connect();
var sk = io.connect('http://172.16.76.95:8080');

//================= CONFIG =================
// Stream Audio
let bufferSize = 2048,
	AudioContext,
	context,
	processor,
	input,
	globalStream;

//vars
var audio = document.getElementById('player');
let audioElement = document.querySelector('audio'),
	finalWord = false,
	resultText = document.getElementById('ResultText'),
	removeLastSentence = true,
	streamStreaming = false;


//audioStream constraints
const constraints = {
	audio: true,
	video: false
};

//================= RECORDING =================



function initRecording() {
	socket.emit('startGoogleCloudStream', ''); //init socket Google Speech Connection
	streamStreaming = true;
	AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext({
		// if Non-interactive, use 'playback' or 'balanced' // https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
		latencyHint: 'interactive',
	});
	processor = context.createScriptProcessor(bufferSize, 1, 1);
	processor.connect(context.destination);
	context.resume();

	var handleSuccess = function (stream) {
		globalStream = stream;
		input = context.createMediaStreamSource(stream);
		input.connect(processor);

		processor.onaudioprocess = function (e) {
			microphoneProcess(e);
		};
	};

	navigator.mediaDevices.getUserMedia(constraints)
		.then(handleSuccess);

}

function microphoneProcess(e) {
	var left = e.inputBuffer.getChannelData(0);
	// var left16 = convertFloat32ToInt16(left); // old 32 to 16 function
	var left16 = downsampleBuffer(left, 44100, 16000)
	socket.emit('binaryData', left16);
}




//================= INTERFACE =================
var startButton = document.getElementById("startRecButton");
startButton.addEventListener("click", startRecording);

var endButton = document.getElementById("stopRecButton");
endButton.addEventListener("click", stopRecording);
endButton.disabled = true;

var recordingStatus = document.getElementById("recordingStatus");


function startRecording() {
	startButton.disabled = true;
	endButton.disabled = false;
	recordingStatus.style.visibility = "visible";
	$("#human_type").show();
	$("#bot_type").hide();
	initRecording();
}

function stopRecording() {
	// waited for FinalWord
	startButton.disabled = false;
	endButton.disabled = true;
	recordingStatus.style.visibility = "hidden";
	streamStreaming = false;
	socket.emit('endGoogleCloudStream', '');


	let track = globalStream.getTracks()[0];
	track.stop();

	input.disconnect(processor);
	processor.disconnect(context.destination);
	context.close().then(function () {
		input = null;
		processor = null;
		context = null;
		AudioContext = null;
		startButton.disabled = false;
	});
	$("#human_type").hide();
	// context.close();


	// audiovideostream.stop();

	// microphone_stream.disconnect(script_processor_node);
	// script_processor_node.disconnect(audioContext.destination);
	// microphone_stream = null;
	// script_processor_node = null;

	// audiovideostream.stop();
	// videoElement.srcObject = null;
}

//================= SOCKET IO =================
ss(socket).on('audio-stream', function(stream, data) {
    parts = [];
    stream.on('data', function(chunk){
        parts.push(chunk);
    });
    stream.on('end', function () {
        audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));
        audio.play();
    });
});

socket.on('connect', function (data) {
	socket.emit('join', 'Server Connected to Client');
});


socket.on('messages', function (data) {
	console.log(data);
});

socket.on('botRecive', function (data) {
	if("image" in data)
	{
		$( "#row_chat" ).append( '<div class="incoming_msg"><div class="incoming_msg_img"><i class="fas fa-robot" style="font-size: 50px;"></i></div><div class="received_msg"><div class="received_withd_msg"><img src="'+data.image+'" style="max-width: 250px" class="img-thumbnail rounded" /><p>'+data.text+'</p><span class="time_date">'+moment().format('LT | L')+'</span></div></div></div>' );
	}
	else {
		$( "#row_chat" ).append( '<div class="incoming_msg"><div class="incoming_msg_img"><i class="fas fa-robot" style="font-size: 50px;"></i></div><div class="received_msg"><div class="received_withd_msg"><p>'+data.text+'</p><span class="time_date">'+moment().format('LT | L')+'</span></div></div></div>' );
	}
})

var sData;
var suggest = false;

sk.on('connect', () => {
	console.log("Connected!");

	// socket.on('message', function (data) {
	// 	console.log(data);
	// })
	sk.on("mess", function(data) {
		console.log(data);

		if (data.sentence !== "")
		{
			sData = data;
			comboTextVoie(sData.sentence+'. Bạn có muốn nhận thông tin gợi ý thực phẩm mình nên ăn?')
			// comboTextVoie()
			suggest = true;
		}
	});
})

function comboTextVoie(txt) {
	$( "#row_chat" ).append( '<div class="incoming_msg"><div class="incoming_msg_img"><i class="fas fa-robot" style="font-size: 50px;"></i></div><div class="received_msg"><div class="received_withd_msg"><p>'+txt+'</p><span class="time_date">'+moment().format('LT | L')+'</span></div></div></div>' );
	socket.emit('playaudio', txt)
}

function lishDish(arr) {
	var str = '<div class="incoming_msg"><div class="incoming_msg_img"><i class="fas fa-robot" style="font-size: 50px;"></i></div><div class="received_msg"><div class="received_withd_msg">';
	for(var i=0; i<arr.length; i++)
	{
		str += '<img src="'+arr[i][2]+'" style="max-width: 250px" class="img-thumbnail rounded" />'
		str += '<p>'+arr[i][1]+'</p>'
	}
	str += '<span class="time_date">'+moment().format('LT | L')+'</span>'
	str+='</div></div></div>'
	$( "#row_chat" ).append(str)
}


socket.on('speechData', function (data) {
	// console.log(data.results[0].alternatives[0].transcript);
	var dataFinal = undefined || data.results[0].isFinal;

	if (dataFinal === false) {
		// console.log(resultText.lastElementChild);
		if (removeLastSentence) { resultText.lastElementChild.remove(); }
		removeLastSentence = true;

		//add empty span
		let empty = document.createElement('span');
		resultText.appendChild(empty);

		//add children to empty span
		let edit = addTimeSettingsInterim(data);

		for (var i = 0; i < edit.length; i++) {
			resultText.lastElementChild.appendChild(edit[i]);
			resultText.lastElementChild.appendChild(document.createTextNode('\u00A0'));
		}

	} else if (dataFinal === true) {
		// console.log(data.results[0].alternatives[0].transcript);
		$( "#row_chat" ).append( '<div class="outgoing_msg"><div class="sent_msg"><p>'+data.results[0].alternatives[0].transcript+'</p><span class="time_date">'+moment().format('LT | L')+'</span> </div></div>' );
		// document.getElementById('ResultText').innerHTML = data.results[0].alternatives[0].transcript

		if (data.results[0].alternatives[0].transcript == "có" && suggest)
		{
			suggest = false;
			lishDish(sData.listDish)
		}
		else if (data.results[0].alternatives[0].transcript == "không" && suggest)
		{
			suggest = false;
			comboTextVoie('Cảm ơn bạn, bạn hãy giữ gìn sức khỏe nhé!')
		}
		else if(!suggest)
		{
			sk.emit('message', {text: data.results[0].alternatives[0].transcript});
		}
	}
});


//================= Juggling Spans for nlp Coloring =================
function addTimeSettingsInterim(speechData) {
	let wholeString = speechData.results[0].alternatives[0].transcript;
	// console.log(wholeString);

	let nlpObject = nlp(wholeString).out('terms');

	let words_without_time = [];

	for (let i = 0; i < nlpObject.length; i++) {
		//data
		let word = nlpObject[i].text;
		let tags = [];

		//generate span
		let newSpan = document.createElement('span');
		newSpan.innerHTML = word;

		//push all tags
		for (let j = 0; j < nlpObject[i].tags.length; j++) {
			tags.push(nlpObject[i].tags[j]);
		}

		//add all classes
		for (let j = 0; j < nlpObject[i].tags.length; j++) {
			let cleanClassName = tags[j];
			// console.log(tags);
			let className = `nl-${cleanClassName}`;
			newSpan.classList.add(className);
		}

		words_without_time.push(newSpan);
	}

	finalWord = false;
	endButton.disabled = true;

	return words_without_time;
}

function addTimeSettingsFinal(speechData) {
	let wholeString = speechData.results[0].alternatives[0].transcript;
	console.log(wholeString);
	let nlpObject = nlp(wholeString).out('terms');
	let words = speechData.results[0].alternatives[0].words;

	let words_n_time = [];

	for (let i = 0; i < words.length; i++) {
		//data
		let word = words[i].word;
		let startTime = `${words[i].startTime.seconds}.${words[i].startTime.nanos}`;
		let endTime = `${words[i].endTime.seconds}.${words[i].endTime.nanos}`;
		let tags = [];

		//generate span
		let newSpan = document.createElement('span');
		newSpan.innerHTML = word;
		newSpan.dataset.startTime = startTime;

		//push all tags
		for (let j = 0; j < nlpObject[i].tags.length; j++) {
			tags.push(nlpObject[i].tags[j]);
		}

		//add all classes
		for (let j = 0; j < nlpObject[i].tags.length; j++) {
			let cleanClassName = nlpObject[i].tags[j];
			// console.log(tags);
			let className = `nl-${cleanClassName}`;
			newSpan.classList.add(className);
		}

		words_n_time.push(newSpan);
	}

	return words_n_time;
}

window.onbeforeunload = function () {
	if (streamStreaming) { socket.emit('endGoogleCloudStream', ''); }
};

window.setInterval(function() {
  var elem = document.getElementById('rowdata');
  elem.scrollTop = elem.scrollHeight;
}, 1000);

//================= SANTAS HELPERS =================

// sampleRateHertz 16000 //saved sound is awefull
function convertFloat32ToInt16(buffer) {
	let l = buffer.length;
	let buf = new Int16Array(l / 3);

	while (l--) {
		if (l % 3 == 0) {
			buf[l / 3] = buffer[l] * 0xFFFF;
		}
	}
	return buf.buffer
}

var downsampleBuffer = function (buffer, sampleRate, outSampleRate) {
	if (outSampleRate == sampleRate) {
		return buffer;
	}
	if (outSampleRate > sampleRate) {
		throw "downsampling rate show be smaller than original sample rate";
	}
	var sampleRateRatio = sampleRate / outSampleRate;
	var newLength = Math.round(buffer.length / sampleRateRatio);
	var result = new Int16Array(newLength);
	var offsetResult = 0;
	var offsetBuffer = 0;
	while (offsetResult < result.length) {
		var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
		var accum = 0, count = 0;
		for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
			accum += buffer[i];
			count++;
		}

		result[offsetResult] = Math.min(1, accum / count) * 0x7FFF;
		offsetResult++;
		offsetBuffer = nextOffsetBuffer;
	}
	return result.buffer;
}

function capitalize(s) {
	if (s.length < 1) {
		return s;
	}
	return s.charAt(0).toUpperCase() + s.slice(1);
}
