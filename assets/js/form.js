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
});

var iframeReady = function() {
    disableInput(false);
    if (!submitted) {
        return;
    }

    window.location.reload();
};

var showPopup = function () {
    let ref = getCookie('reference');
    let total = getCookie('total');
    if (!ref || !total) {
        return;
    }

    let text = '<div>Your order reference is:</div>'
        +'<h3 class="text-primary">' + ref +'</h3>'
        +'<div>Order Total:</div>'
        +'<h3 class="text-success">PHP ' + total +'</h3>'
        +'<hr />'
        +'<p>Your order is now PENDING CONFIRMATION! Thank you so much for your help. This will go a long way in helping our frontliners and countrymen in the fight against COVID-19. Please check instructions below to be able to proceed with payment.</p>'

        +'<hr />'
        + '<h3>Payment Instruction</h3>'
        +'<div>Kindly send your donations to any one of our bank accounts:</div>'
        +'<div> - Account Name: STERLING PAPER PRODUCTS ENT., INC.</div>'
        +'<div> - UCPB 202-53000083-1</div>'
        +'<div> - MBTC 233-3-23351529-0</div>'
        +'<div> - BDO 001450016896</div>'
        +'<div> - PBCOM 218-10-000024-0</div>'
        +'<div> - Once deposit has been made, please send us a copy of the deposit slip <here (shows the Upload Deposit Slip CTA)>. We will get back to you right away to confirm your deposit payment.</div>'
        +'<div> - Thank you.</div>';
    
    $.confirm({
        title: 'Order Summary',
        type: 'green',
        content: text,
        buttons: {
            'Upload Proof of Payment' : function () {
                window.location.href = '/deposit-slip.html';
            },
            'Close' : function () {}
        }
    })
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
    $('.submit-btn, .deposit-btn').prop('disabled', d);
    let txt = 'Submit Order';
    let depositTxt = 'Submit Deposit Slip'
    if (d) {
        txt = 'Please wait...';
        depositTxt = 'Please wait...';
    }
    
    $('.submit-btn').html(txt);
    $('.deposit-btn').html(depositTxt);
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
        addErrorMsgToElementGroup($('#input-contact').parent(), '#input-contact', 'Must be a number');
        err = true;
    }
    

    $('.input-qty').each(function () {
        if (!err && !$(this).val().match(/^\d+$/)) {
            addErrorMsgToElementGroup($(this).parent(), '.input-qty', 'Must be a number');
            err = true;
        }

    });

    if (!err) {
        $('.beneficiaries .beneficiary').each(function () {
            if ($(this).find('.input-shipping-mode').val() == 'pickup')
                err = validatePickup(this);
            else
                err = validateDelivery(this);

            if(!$(this).find('.input-point-contact').val().match(/^\d+$/)) {
                addErrorMsgToElementGroup(this, '.input-point-contact', 'Must be a number');
                err = true;
            }
        });

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
    prepareForm();
    $('.real-form').submit();
};

var uuid = function () {
    return  Math.floor(Math.random() * Date.now());
    
};

var prepareForm = function () {
    $('.input-form').each(function () {
        if ($('.real-form').find('#' + $(this).attr('id').replace('input-', '')).hasClass('populatable')) {
            $('.real-form').find('#' + $(this).attr('id').replace('input-', '')).val($(this).val());
        }
    });

    $('.real-form #beneficiary').val(prepareBeneficiaries());
    let reference = uuid();
    let totalBox = 0;
    $('.beneficiaries .beneficiary').each(function () {
        totalBox += parseInt($(this).find('.input-qty').val());
    });

    $('.real-form #total-box').val(totalBox);
    setCookie('reference', reference, 30);
    setCookie('total', getOrderTotal(), 30);
    
    $('.real-form #reference').val(reference);
};

var prepareBeneficiaries = function () {
    let beneficiary = [];
    $('.beneficiaries .beneficiary').each(function () {
        let entry = [];
        $(this).find('.input-form').each(function () {
            entry.push($(this).val());
        });

        if ($(this).find('.input-shipping-mode').val() == 'pickup') {
            entry.push($(this).find('.input-pickup:checked').val());
        } else if ($(this).find('.input-shipping-mode').val() == 'delivery') {
            entry.push($(this).find('.input-address').val());
        }
        
        beneficiary.push(entry.join('  ;;;  '));
    });

    return beneficiary.join("\n");
};

var validatePickup = function(self) {
    if (typeof $(self).find('.input-pickup:checked').val() == 'undefined') {
        addErrorMsgToElementGroup(self, '.input-shipping-mode', 'Please select a branch where you want to pickup your order');
        return true;
    }

    return false;
};

var validateDelivery = function(self) {
    if (!$(self).find('.input-address').val()) {
        addErrorMsgToElementGroup(self, '.input-shipping-mode', 'Please enter your delivery address');
        return true;
    }

    return false;
};

var addErrorMsgToElementGroup = function(self, elm, msg) {
    $(self).find(elm).parents().each(function() {
        if ($(this).hasClass('form-group')) {
            $(this).append('<div class="error-msg"><small class="text-danger">' + msg + '</small></div>');
            $(this).find('.input-form').addClass('err');
        }
    });
};

var setCookie = function (name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
};

var getCookie = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
};

var removeCookie = function (name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
};


$('.add-beneficiary').click(function (e) {
    e.preventDefault();
    addNewBeneficiary();
});

$(document).on('click', '.remove-beneficiary', function (e) {
    e.preventDefault();
    let self = this;
    $.confirm({
        title: 'Remove Beneficiary',
        type: 'red',
        content: 'Are you sure your want to remove this beneficiary?',
        buttons: {
            'Yes' : function () {
                $(self).parent().remove();
            },
            'No' : function () {}
        }
    });
});

$(document).on('change', '.input-qty', function () {
    let qty = parseInt($(this).val()) * 120;
    let txt = numberFormat(qty) + ' face shields = PHP' + numberFormat( qty * 35 );
    $(this).parent().find('.faceshield-count').text(txt);
    return calculateTotalOrders();
});


$(document).on('change' ,'.input-shipping-mode', function () {
    $(this).parent().parent().find('.shipping-mode').hide();
    $(this).parent().parent().find('#' + $(this).val()).show();
});

var calculateTotalOrders = function () {
    $('.order-total .order-total-value').text(getOrderTotal());
}

var getOrderTotal = function () {
    let total = 0;
    $('.input-qty').each(function () {
        total += ($(this).val() * 120) *35;
    });

    return numberFormat(total);
}

var numberFormat = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var addNewBeneficiary = function () {
    lastBeneficiaryIndex = $('.beneficiaries .beneficiary').last().data('index');
    let i = parseInt(lastBeneficiaryIndex) + 1;
    let tpl = $('#beneficiary-tpl').html().replace(/\[INDEX\]/g, i);

    $('.beneficiaries').append(tpl);
};


var depositSubmit = false;

$('.deposit-btn').click(function () {
    validateDeposit();
});

var validateDeposit = function () {
    let err = false;

    disableInput(true);
    $('.error-msg').remove();
    if (!$('#input-reference').val().trim()) {
        addErrorMsgToElementGroup($('#input-reference').parent(), '#input-reference', 'Please enter your Order reference');
        err = true;
    }

    if (!$('#input-deposit-slip').val().trim()) {
        addErrorMsgToElementGroup($('#input-reference').parent().parent().parent(), '#input-deposit-slip', 'Please upload your deposit slip');
        err = true;
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

    populateForm();
    depositSubmit = true;
    $('.real-deposit-form').submit();
}

var populateForm = function () {
    $('.real-deposit-form #reference').val($('#input-reference').val());
    $('.real-deposit-form #deposit-slip').val($('#input-deposit-slip').val())
}

var depositReady = function () {
    if (!depositSubmit) {
        return;
    }

    removeCookie('reference');
    removeCookie('total');
    $.alert({
        title: 'Success',
        type: 'green',
        content: 'Transaction complete! We will get back to you as soon as we confirm your order. Thank you!',
        buttons: {
            Ok: function () {
                window.location.reload();
            }
        }
    })
}
