// UI sliders to be used on studio page
function initSliders(){
  $(".f1Dist-slider-micA").ionRangeSlider({
        skin: "modern",
        min: 0,
        max: 50,
        onStart: function (data) {
          data.from = 0;
        },
        onChange: function (data) {
          f1DistA = data.from;
        }
  });
  $(".f2Dist-slider-micA").ionRangeSlider({
        skin: "modern",
        min: 0,
        max: 50,
        onStart: function (data) {
          data.from = 0;
        },
        onChange: function (data) {
          f2DistA = data.from;
        }
  });
  $(".f1Dist-slider-micB").ionRangeSlider({
        skin: "modern",
        min: 0,
        max: 50,
        onStart: function (data) {
          data.from = 0;
        },
        onChange: function (data) {
          f1DistB = data.from;
        }
  });
  $(".f2Dist-slider-micB").ionRangeSlider({
        skin: "modern",
        min: 0,
        max: 50,
        onStart: function (data) {
          data.from = 0;
        },
        onChange: function (data) {
          f2DistB = data.from;
        }
  });
}

initSliders();
