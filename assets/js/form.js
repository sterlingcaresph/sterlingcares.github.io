var submitted = false;
$('#input-shipping-mode').change(function() {
  $('.shipping-mode').hide();
  $('.shipping-mode#' + this.value).show();
});

$('#deposit-slip-btn').click(function() {
  $('#deposit-slip-file').click();
});

$('#deposit-slip-file').change(function(e) {
  fileToTxt(this.files[0]);
});

$('.close-preview').click(function(e) {
  e.preventDefault();
  closePreview();
});

$('.submit-btn').click(function() {
  disableInput(true);
  validateInput();
  disableInput(false);
});

var iframeReady = function() {
  console.log(submitted);
  if (!submitted) {
    return;
  }
  
  $.alert({
    title: 'Success',
    type: 'green',
    content: 'You order was successfull. Thank you!',
    buttons: {
      Ok: function() {
        window.location.reload();
      }
    }
  });

  
};

var closePreview = function() {
  $('.display-upload').hide();
  $('.upload-btn').show();
  $('.upload-preview img').attr('src', '');
  $('.upload-preview input[type="hidden"].deposit-slip').val('');
};

var saveToCloud = function (str) {
  $.post('https://files.sterlingcares.ph/upload.php', {file : str}, function(res) {
    res = eval('(' + res + ')');
    disableInput(false);
    
    if (res.type == 'error') {
      $.alert({
        title : 'Error',
        type : 'red',
        content: res.message
      });
      
      return;
    }

    $('.upload-preview img').attr('src', res.data);
    $('.upload-preview input[type="hidden"].deposit-slip').val(res.data);
    $('.upload-btn').hide();
    $('.display-upload').show();
  }).fail(function(err) {
    $.alert({
      title: 'Error',
      type: 'red',
      content: 'Something went wrong with your request. Please try again later'
    });

    disableInput(false);
  });
};

var fileToTxt = function(file) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function() {
    disableInput(true);
    saveToCloud(reader.result);
  };

  reader.onerror = function(error) {
    disableInput(false);
    $.alert({
      title: 'Error',
      type: 'red',
      content: 'Something went wrong. Please try again.'
    });
  };
};

var disableInput = function(d) {
  d = d || false;
  $('.form-control').prop('disabled', d);
  $('.submit-btn').prop('disabled', d);
  let txt = 'Submit Order';
  if (d) {
    txt = 'Please wait...';
  }
  
  $('.submit-btn').html(txt);
};

var validateInput = function () {
  let err = false;
  disableInput(true);
  $('.error-msg').remove();
  $('.input-form').removeClass('err');
  $('.input-form').each(function() {
    if ($(this).hasClass('required-input') && !$(this).val()) {
      addErrorMsgToElementGroup(this, 'This field is required');
      $(this).addClass('err');
      err = true;
    }
  });

  if (!err && !$('#input-contact').val().match(/^\d+$/)) {
    addErrorMsgToElementGroup('#input-contact', 'Must be a number');
    err = true;
  }
  
  if (!err && !$('#input-qty').val().match(/^\d+$/)) {
    addErrorMsgToElementGroup('#input-qty', 'Must be a number');
    err = true;
  }

  if (!err) {
    if ($('#input-shipping-mode').val() == 'pickup')
      err = validatePickup();
    else
      err = validateDelivery();

  }

  if (err) {
    $.alert({
      title : 'Error',
      type : 'red',
      content : 'Please correct the error(s) in the form to continue placing an order'
    });

    
    disableInput(false);
    return;
  }

  submitted = true;
  $('.input-form').each(function() {
    let id = $(this).attr('id');
    let name = id.replace(/^input-/, '');
    $('.real-form #' + name).val($(this).val());
  });

  $('#pickup-location').val($('[name="branch"]:checked').val());

  $('.real-form').submit();
};



var validatePickup = function() {
  if (typeof $('[name="branch"]:checked').val() == 'undefined') {
    addErrorMsgToElementGroup('#input-shipping-mode', 'Please select a branch where you want to pickup your order');
    return true;
  }

  return false;
};

var validateDelivery = function() {
  if (!$('#input-address').val()) {
    addErrorMsgToElementGroup('#input-shipping-mode', 'Please enter your delivery address');
    return true;
  }

  return false;
};

var addErrorMsgToElementGroup = function(elm, msg) {
  $(elm).parents().each(function() {
    if ($(this).hasClass('form-group')) {
      $(this).append('<div class="error-msg"><small class="text-danger">' + msg + '</small></div>');
    }
  });
};
