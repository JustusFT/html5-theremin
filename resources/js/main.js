$(document).ready(function () {
    $("select").select2({
        minimumResultsForSearch: -1
    });
    /*
     * CONSTANTS
     */
    var key = 3;
    var scale = 1;

    /*
     * VARIABLES
     */
    var playfieldY1;
    var playfieldY2;
    var windowWidth;

    var minFreq = 80;
    var maxFreq = 1400;
    var maxVolume = 0.5;
    var proportionality = 0;
    var invertVolume = false;
    var invertPitch = false;

    var optionsOpened = 0;

    /*
     * SELECT2
     */
    $("#select-key").change(function () {
        key = $(this).prop("selectedIndex");
        setGuidelines();
    });

    $("#select-scale").change(function () {
        scale = $(this).prop("selectedIndex");
        setGuidelines();
    });

    /*
     * JQUERY UI
     */
    //sliders
    $("#slider-frequency").slider({
        range: true,
        min: 20,
        max: 4200,
        values: [80, 1400]
    }).on("slide", function (e, ui) {
        if (ui !== undefined) {
            $("#input-minFreq").val(ui.values[0]);
            $("#input-maxFreq").val(ui.values[1]);
        }
        minFreq = $("#input-minFreq").val();
        maxFreq = $("#input-maxFreq").val();
    }).on("slidechange", setGuidelines);
    inputSlider("#slider-frequency", "#input-minFreq", "#input-maxFreq");

    $("#slider-volumeArea").slider({
        range: "min",
        min: 1,
        max: 100,
        value: 50
    }).on("slide", function (e, ui) {
        if (ui !== undefined) {
            $("#input-volumeArea").val(ui.value);
        }
        $("#volumeField").css("height", $("#input-volumeArea").val() + "%");
    }).on("slidechange", setPositions);
    inputSlider("#slider-volumeArea", "#input-volumeArea");

    $("#slider-maxVolume").slider({
        range: "min",
        min: 0,
        max: 100,
        value: 50
    }).on("slide", function (e, ui) {
        if (ui !== undefined) {
            $("#input-maxVolume").val(ui.value);
        }
    }).on("slidechange", function () {
        maxVolume = $("#input-maxVolume").val() / 100;
    });
    inputSlider("#slider-maxVolume", "#input-maxVolume");

    $("#slider-filter").slider({
        range: "max",
        min: 20,
        max: 14000,
        value: 14000
    }).on("slide", function (e, ui) {
        if (ui !== undefined) {
            $("#input-filter").val(ui.value);
        }
        biquadFilter.frequency.value = $("#input-filter").val();
    });
    inputSlider("#slider-filter", "#input-filter");

    //checkboxradios
    $("input[type='radio']").checkboxradio({
        icon: false
    });

    /*
     * AUDIO NODES
     */
    //create nodes
    var context = new (window.AudioContext || window.webkitAudioContext)();
    var gainNode = context.createGain();
    var biquadFilter = context.createBiquadFilter();
    var oscillator = context.createOscillator();

    //plug in nodes
    oscillator.connect(biquadFilter);
    biquadFilter.connect(gainNode);
    gainNode.connect(context.destination);

    //set up and turn on nodes
    gainNode.gain.value = 0;
    oscillator.start(context.currentTime);
    biquadFilter.type = "lowpass";
    biquadFilter.frequency.value = 14000;

    /*
     * EVENT HANDLERS
     */
    //window resize
    $(window).on("resize", setPositions);

    //go to options
    $(window).keypress(function (e) {
        if (e.which !== 111)
            return;
        function slideScreen(slide, screenId) {
            $("#options").css({transform: "translate(" + slide + ", 0)"});
            optionsOpened = screenId;
        }
        switch (optionsOpened) {
            case 0:
                slideScreen("0", 1);
                break;
            case 1:
                slideScreen("-100%", 0);
                break;
        }
    });

    //allow numbers + backspace only for input fields
    $("input[type='text']").keypress(function (e) {
        if (e.which !== 8 && (e.which < 48 || e.which > 57))
            return false;
    });

    //hide menuInfo on hover
    $("#menuInfo").on("mouseover", function () {
        $("#menuInfo").css({
            zIndex: 0,
            opacity: 0.5
        });
    });

    //change sound when mouse moves
    $("#playField").on("mousemove", function (e) {
        //recover moenuInfo on mouseleave
        if (e.pageX > $("#menuInfo").width() || e.pageY > $("#menuInfo").height()) {
            $("#menuInfo").css({
                zIndex: 90000,
                opacity: 1
            });
        }

        var x;
        var y = Math.max(0, Math.min(e.pageY - playfieldY1, playfieldY2)) / playfieldY2;
        switch (invertPitch) {
            case false:
                x = e.pageX;
                break;
            case true:
                x = windowWidth - e.pageX;
                break;
        }

        switch (invertVolume) {
            case false:
                gainNode.gain.value = (1 + (y * -1)) * (maxVolume);
                break;
            case true:
                gainNode.gain.value = y * (maxVolume);
                break;
        }

        switch (proportionality) {
            case 0:
                oscillator.frequency.value = Math.pow(2, x * (Math.log(maxFreq / minFreq) / Math.log(2) / windowWidth)) * minFreq;
                break;
            case 1:
                oscillator.frequency.value = (x * (maxFreq - minFreq) / windowWidth) + minFreq;
                break;
        }
    });

    //stop sound when mouse in options
    $("#options").on("mouseover", function () {
        gainNode.gain.value = 0;
    });

    //checkboxradio changes
    $("input[name='radio-prop']").change(function () {
        proportionality = $(this).parent().parent().find("input[name='radio-prop']").index(this);
        setGuidelines();
    });

    $("input[name='radio-waveform']").change(function () {
        var index = $(this).parent().parent().find("input[name='radio-waveform']").index(this);
        switch (index) {
            case 0:
                oscillator.type = "sine";
                break;
            case 1:
                oscillator.type = "triangle";
                break;
            case 2:
                oscillator.type = "square";
                break;
            case 3:
                oscillator.type = "sawtooth";
                break;
        }
    });

    //checkbox (switch) changes
    $("#checkbox-volumeAxis").change(function () {
        if ($(this).is(":checked")) {
            invertVolume = true;
        } else {
            invertVolume = false;
        }
    });

    $("#checkbox-pitchAxis").change(function () {
        if ($(this).is(":checked")) {
            invertPitch = true;
        } else {
            invertPitch = false;
        }
        setGuidelines();
    });

    /*
     * Main Functions
     */
    function setPositions() {
        playfieldY1 = $("#volumeField").position().top;
        playfieldY2 = $("#volumeField").height();
        windowWidth = $(window).width();
        setGuidelines();
    }
    setPositions();

    function setGuidelines() {
        $("#guidelines").empty();
        var scales = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
            [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
            [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0],
            [1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0]
        ];
        var chosenScale = scales[scale];

        for (var i = 0; i < 88; i++) {
            if (chosenScale[(i - 1 - key) % 12] === 0)
                continue;

            var tone;
            var x;

            switch (proportionality) {
                case 0:
                    tone = (Math.pow(Math.pow(2, 1 / 12), i - 49) * 440);
                    x = (Math.log(tone / minFreq) / Math.log(2)) / (((Math.log(maxFreq / minFreq)) / (Math.log(2))) / windowWidth) / windowWidth * 100;
                    break;
                case 1:
                    tone = (Math.pow(Math.pow(2, 1 / 12), i - 49) * 440);
                    x = (((tone * windowWidth) - (minFreq * windowWidth)) / (maxFreq - minFreq)) / windowWidth * 100;
                    break;
            }

            if (invertPitch)
                x = 100 - x;

            $("#guidelines").append("<div class='guideline' style='left:" + x + "%;background-color:hsl(" + 360 * (((i - 1) % 12) / 12) + ", 100%, 50%)'></div>");
        }
    }

    //Enable text inputs for sliders
    function inputSlider(slider, inputA, inputB) {
        if (inputB === undefined || inputB === null) {
            $(inputA).on("change", function () {
                $(inputA).val(Math.max($(slider).slider("option", "min"), Math.min($(inputA).val(), $(slider).slider("option", "max"))));
                $(slider).slider("value", $(inputA).val());
                $(slider).trigger("slide");
                $(slider).trigger("slidechange");
            });
        } else {
            $(inputA).on("change", function () {
                $(inputA).val(Math.max($(slider).slider("option", "min"), Math.min($(inputA).val(), $(slider).slider("values")[1])));
                $(slider).slider("values", 0, $(inputA).val());
                $(slider).trigger("slide");
                $(slider).trigger("slidechange");
            });
            $(inputB).on("change", function () {
                $(inputB).val(Math.min($(slider).slider("option", "max"), Math.max($(inputB).val(), $(slider).slider("values")[0])));
                $(slider).slider("values", 1, $(inputB).val());
                $(slider).trigger("slide");
                $(slider).trigger("slidechange");
            });
        }
    }
});