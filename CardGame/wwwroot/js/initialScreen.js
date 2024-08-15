const showGameTitle = setTimeout(showGameTitleFunction, 4000);

$('body').on('click', '#initialScreen', function () {
    if ($('.logoSubtext').is(':visible')) {
        $('#initialScreen').hide()
        $("body").append("<audio autoplay loop id='initialPageAudio'><source src='../resources/InitialMusic.mp3'></audio>");
        // $('#initialPageAudio').play()
    }
});

$('body').on('click', '#stopMusic', function () {
    $('#stopMusic').hide();
    document.getElementById('initialPageAudio').pause();
    $('#playMusic').show();
});

$('body').on('click', '#playMusic', function () {
    $('#playMusic').hide();
    document.getElementById('initialPageAudio').play();
    $('#stopMusic').show();
});

function showGameTitleFunction() {
    $('#logoTitle').css('display', 'block');
}