function initSliders(){
  $(".f1-js-range-slider-micA").ionRangeSlider({
        onStart: function (data) {
          data.from = 0,
          data.to = 100;
        },
        onChange: function (data) {
          f1LowMicA = data.from,
          f1HighMicA = data.to;
        },
        onStop: function (data) {
          data.from = 0,
          data.to = 100;
        },
    });
  $(".f2-js-range-slider-micA").ionRangeSlider({
        onStart: function (data) {
          data.from = 0,
          data.to = 100;
        },
        onChange: function (data) {
          f2LowMicA = data.from,
          f2HighMicA = data.to;
        }
    });
  $(".f3-js-range-slider-micA").ionRangeSlider({
        onStart: function (data) {
          data.from = 0,
          data.to = 100;
        },
        onChange: function (data) {
          f3LowMicA = data.from,
          f3HighMicA = data.to;
        }
    });
  $(".f1-js-range-slider-micB").ionRangeSlider({
        onStart: function (data) {
          data.from = 0,
          data.to = 100;
        },
        onChange: function (data) {
          f1LowMicB = data.from,
          f1HighMicB = data.to;
        }
    });
  $(".f2-js-range-slider-micB").ionRangeSlider({
        onStart: function (data) {
          data.from = 0,
          data.to = 100;
        },
        onChange: function (data) {
          f2LowMicB = data.from,
          f2HighMicB = data.to;
        }
    });
  $(".f3-js-range-slider-micB").ionRangeSlider({
        onStart: function (data) {
          data.from = 0,
          data.to = 100;
        },
        onChange: function (data) {
          f3LowMicB = data.from,
          f3HighMicB = data.to;
        }
    });
}

initSliders();
