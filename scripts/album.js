 var setSong = function(songNumber) {
     if (currentSoundFile) {
        currentSoundFile.stop();
     }
     currentlyPlayingSongNumber = parseInt(songNumber);
     currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
     // #1
     currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
         // #2
         formats: [ 'mp3' ],
         preload: true
     });

     setVolume(currentVolume);
 };



 var setVolume = function(volume) {
     if (currentSoundFile) {
         currentSoundFile.setVolume(volume);
     }
 };

 var getSongNumberCell = function(number) {
   return $('.song-item-number[data-song-number="' + number + '"]');
 };

 var createSongRow = function(songNumber, songName, songLength) {
     var template =
        '<tr class="album-view-song-item">'
      + '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
      + '  <td class="song-item-title">' + songName + '</td>'
      + '  <td class="song-item-duration">' + filterTimeCode() + '</td>'
      + '</tr>'
      ;
      var getSongNumberCell = function(number) {
      return $('.song-item-number[data-song-number="' + number + '"]');
      }

     var $row = $(template);

     var clickHandler = function() {
       var songNumber = parseInt($(this).attr('data-song-number'));

       if (currentlyPlayingSongNumber !== null) {
            // Revert to song number for currently playing song because user started playing new song.
            var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
            currentlyPlayingCell.html(currentlyPlayingSongNumber);
       }
       if (currentlyPlayingSongNumber !== songNumber) {
            // Switch from Play -> Pause button to indicate new song is playing.
            setSong(songNumber);
            currentSoundFile.play();
            updateSeekPercentage();
            $(this).html(pauseButtonTemplate);
            currentSongFromAlbum = currentAlbum.songs[songNumber - 1];

            var $volumeFill = $('.volume .fill');
            var $volumeThumb = $('.volume .thumb');
            $volumeFill.width(currentVolume + '%');
            $volumeThumb.css({left: currentVolume + '%'});

            updatePlayerBarSong();
       } else if (currentlyPlayingSongNumber === songNumber) {
            if (currentSoundFile.isPaused()) {
                 $(this).html(pauseButtonTemplate);
                 $('.main-controls .play-pause').html(playerBarPauseButton);
                 currentSoundFile.play();
                 updateSeekBarWhileSongPlays();
            } else {
                 $(this).html(playButtonTemplate);
                 $('.main-controls .play-pause').html(playerBarPlayButton);
                 currentSoundFile.pause();
            }
          }
     };

     var onHover = function(event) {
       var songNumberCell = $(this).find('.song-item-number');
       var songNumber = parseInt(songNumberCell.attr('data-song-number'));

       if (songNumber !== currentlyPlayingSongNumber) {
          songNumberCell.html(playButtonTemplate);
       }
     };

     var offHover = function(event) {
       var songNumberCell = $(this).find('.song-item-number');
       var songNumber = parseInt(songNumberCell.attr('data-song-number'));

       if (songNumber !== currentlyPlayingSongNumber) {
          songNumberCell.html(songNumber);
       }
       console.log("songNumber type is " + typeof songNumber + "\n and currentlyPlayingSongNumber type is " + typeof currentlyPlayingSongNumber);
     };

     // #1
     $row.find('.song-item-number').click(clickHandler);
     // #2
     $row.hover(onHover, offHover);
     // #3
     return $row;
 };


 var setCurrentAlbum = function(album) {
     currentAlbum = album;
     var $albumTitle = $('.album-view-title');
     var $albumArtist = $('.album-view-artist');
     var $albumReleaseInfo = $('.album-view-release-info');
     var $albumImage = $('.album-cover-art');
     var $albumSongList = $('.album-view-song-list');

     $albumTitle.text(album.title);
     $albumArtist.text(album.artist);
     $albumReleaseInfo.text(album.year + ' ' + album.label);
     $albumImage.attr('src', album.albumArtUrl);

     $albumSongList.empty();

     // #4
     for (var i = 0; i < album.songs.length; i++) {
       var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
       $albumSongList.append($newRow);
     }
 };

 var updateSeekBarWhileSongPlays = function() {
     if (currentSoundFile) {
         // #10
         currentSoundFile.bind('timeupdate', function(event) {
             // #11
             var seekBarFillRatio = this.getTime() / this.getDuration();
             var $seekBar = $('.seek-control .seek-bar');
             setCurrentTimeInPlayerBar(currentTime);

             updateSeekPercentage($seekBar, seekBarFillRatio);
         });
     }
 };

 var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;
    // #1
    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);

    // #2
    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
 };

 var setupSeekBars = function() {
     var $seekBars = $('.player-bar .seek-bar');

     $seekBars.click(function(event) {

         var offsetX = event.pageX - $(this).offset().left;
         var barWidth = $(this).width();
         var seekBarFillRatio = offsetX / barWidth;

         updateSeekPercentage($(this), seekBarFillRatio);
     });

     $seekBars.find('.thumb').mousedown(function(event) {

         var $seekBar = $(this).parent();

         $(document).bind('mousemove.thumb', function(event){
             var offsetX = event.pageX - $seekBar.offset().left;
             var barWidth = $seekBar.width();
             var seekBarFillRatio = offsetX / barWidth;

             updateSeekPercentage($seekBar, seekBarFillRatio);
         });

         $(document).bind('mouseup.thumb', function() {
             $(document).unbind('mousemove.thumb');
             $(document).unbind('mouseup.thumb');
         });
     });
 };

 var trackIndex = function(album, song) {
     return album.songs.indexOf(song);
 };

 var nextSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    // Note that we're _incrementing_ the song here
    currentSongIndex++;

    if (currentSongIndex >= currentAlbum.songs.length) {
        currentSongIndex = 0;
    }

    // Save the last song number before changing it
    var lastSongNumber = currentlyPlayingSongNumber;

    // Set a new current song
    currentlyPlayingSongNumber = currentSongIndex + 1;
    currentSongFromAlbum = currentAlbum.songs[currentSongIndex];

    // Update the Player Bar information
    updatePlayerBarSong();
    setSong(currentlyPlayingSongNumber);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();

    var $nextSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);

    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var previousSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    // Note that we're _decrementing_ the index here
    currentSongIndex--;

    if (currentSongIndex < 0) {
        currentSongIndex = currentAlbum.songs.length - 1;
    }

    // Save the last song number before changing it
    var lastSongNumber = currentlyPlayingSongNumber;

    // Set a new current song
    currentlyPlayingSongNumber = currentSongIndex + 1;
    currentSongFromAlbum = currentAlbum.songs[currentSongIndex];

    // Update the Player Bar information
    updatePlayerBarSong();
    setSong(currentlyPlayingSongNumber);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();

    $('.main-controls .play-pause').html(playerBarPauseButton);

    var $previousSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);

    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};


 var updatePlayerBarSong = function() {

    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
    $('.main-controls .play-pause').html(playerBarPauseButton);
    setTotalTimeInPlayerBar(totalTime);

};
 // create a variable called togglePlayFromPlayerBar that is a function that doesn't take any parameters
 var togglePlayFromPlayerBar = function() {
    // create a variable called $currentlyPlayingCell that grabs the song number cell of the currently playing song number
    var $currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
   // if the current sound file is paused
    if (currentSoundFile.isPaused()) {
        // change the html of the currently playing cell with the pause button template
        $currentlyPlayingCell.html(pauseButtonTemplate);
        // also change the html of the player bar pause button
        $(this).html(playerBarPauseButton);
        // play the current sound file
        currentSoundFile.play();
      // else
    } else {
        // change the html of the currently playing cell with the play button template
        $currentlyPlayingCell.html(playButtonTemplate);
        // also change the html of the player bar so it displays the player bar play button
        $(this).html(playerBarPlayButton);
        // pause the current sound file
        currentSoundFile.pause();
    }
};

// declare a function expression called filterTimeCode that takes in timeInSeconds as a parameter
var filterTimeCode = function(timeInSeconds) {
  //set time in seconds to equal the parsed float of timeInSeconds
  parseFloat(timeInSeconds);
  // declare a variable called seconds that concatinates a "0" to the result of remainder of timeInSeconds and 60 run through Math.floor to return the highest integer
  var seconds = Math.floor(timeInSeconds % 3600 % 60);
  // declare a variable called minutes that divides timeInSeconds by 60 and runs it through Math.floor to return the highest integer
  var minutes = Math.floor(timeInSeconds % 3600 / 60);
  // Remove the 0 in front of seconds with more than 2 characters, e.g. 010 but not 09
  var formattedSeconds = seconds.substr(0, 2);
  // return the concatination of minutes, a colon, and the value of last two elements in seconds (look up slice() method)
  return minutes + ":" + formattedSeconds;
};
 // end function


 // To do:
 // 1. change "+ <td class="song-item-duration">' + songLength + '</td>'"" in createSongRow to use the filterTimeCode function and display the result of running songLength through the function
 // 2. update updateSeekBarWhileSongPlays function so that setCurrentTimeInPlayerBar shows the current time run through the filterTimeCode function (you will need to use getTime())

 // declare a function called setCurrentTimeInPlayerBar that accepts currentTime as a parameter
 var setCurrentTimeInPlayerBar = function(currentTime) {
   // use jquery to select the .current-time class and change the text inside of that to currentTime
   $(".current-time").text(currentTime);
 };
 // end function

  // declare a function called setTotalTimeInPlayerBar that accepts totalTime as a parameter
 var setTotalTimeInPlayerBar = function(totalTime) {
   // use jquery to select the .total-time class and change the text inside of that to totalTime
   $(".total-time").text(totalTime);
 } ;
 // end function

 // Album button templates
 var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
 var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
 var playerBarPlayButton = '<span class="ion-play"></span>';
 var playerBarPauseButton = '<span class="ion-pause"></span>';


 // Store state of playing songs
 var currentAlbum = null;
 var currentlyPlayingSongNumber = null;
 var currentSongFromAlbum = null;
 var currentSoundFile = null;
 var currentVolume = 80;

 var $previousButton = $('.main-controls .previous');
 var $nextButton = $('.main-controls .next');
 var mainControlsPlayPause = $('.main-controls .play-pause');



 $(document).ready(function() {
     setCurrentAlbum(albumPicasso);
     setupSeekBars();
     $previousButton.click(previousSong);
     $nextButton.click(nextSong);
     mainControlsPlayPause.click(togglePlayFromPlayerBar);
  });
