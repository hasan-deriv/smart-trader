var template = require('../../base/utility').template;

var PaymentAgentWithdrawWS = (function() {
    "use strict";

    var containerID,
        viewIDs,
        fieldIDs,
        errorClass,
        hiddenClass,
        $views;

    var formData,
        isValid;

    var withdrawCurrency,
        minAmount,
        maxAmount;

    var init = function() {
        containerID = '#paymentagent_withdrawal';
        $views      = $(containerID + ' .viewItem');
        errorClass  = 'errorfield';
        hiddenClass = 'hidden';
        viewIDs = {
            error   : '#viewError',
            success : '#viewSuccess',
            confirm : '#viewConfirm',
            form    : '#viewForm'
        };
        fieldIDs = {
            verificationCode : '#verification-code',
            ddlAgents        : '#ddlAgents',
            txtAmount        : '#txtAmount',
            txtDesc          : '#txtDescription'
        };
        withdrawCurrency = 'USD';
        minAmount = 10;
        maxAmount = 2000;

        $views.addClass(hiddenClass);

        if(page.client.is_virtual()) { // Virtual Account
            showPageError(page.text.localize('You are not authorized for withdrawal via payment agent.'));
            return false;
        }

        var residence = Cookies.get('residence');

        if (page.client_status_detected('withdrawal_locked, cashier_locked', 'any')) {
            lock_withdrawal('locked');
        } else {
            BinarySocket.send({"paymentagent_list": residence});
        }

        $(viewIDs.form + ' button').click(function(e){
            e.preventDefault();
            e.stopPropagation();
            formData = formValidate();
            if(!formData) {
                return false;
            }
            else {
                withdrawRequest(true);
            }
        });
    };

    // -----------------------
    // ----- Agents List -----
    // -----------------------
    var populateAgentsList = function(response) {
        var $ddlAgents = $(fieldIDs.ddlAgents);
        $ddlAgents.empty();
        var paList = response.paymentagent_list.list;
        if(paList.length > 0) {
            BinarySocket.send({verify_email: TUser.get().email, type:'paymentagent_withdraw'});
            insertListOption($ddlAgents, page.text.localize('Please select a payment agent'), '');
            for(var i = 0; i < paList.length; i++){
                insertListOption($ddlAgents, paList[i].name, paList[i].paymentagent_loginid);
            }
            setActiveView(viewIDs.form);
        }
        else {
            showPageError(page.text.localize('The Payment Agent facility is currently not available in your country.'));
        }
    };

    var insertListOption = function($ddlObject, itemText, itemValue) {
        $ddlObject.append($('<option/>', {value: itemValue, text: itemText}));
    };

    // ----------------------------
    // ----- Form Validations -----
    // ----------------------------
    var formValidate = function() {
        clearError();
        isValid = true;

        var agent  = $(fieldIDs.ddlAgents).val(),
            amount = $(fieldIDs.txtAmount).val().trim(),
            desc   = $(fieldIDs.txtDesc).val().trim(),
            token  = $(fieldIDs.verificationCode).val().trim();

        var letters = Content.localize().textLetters,
            numbers = Content.localize().textNumbers,
            space   = Content.localize().textSpace,
            period  = Content.localize().textPeriod,
            comma   = Content.localize().textComma;

        // Payment Agent
        isRequiredError(fieldIDs.ddlAgents);

        // verification token
        if(!isRequiredError(fieldIDs.verificationCode)){
          if (token.length !== 48) {
            showError(fieldIDs.verificationCode, Content.errorMessage('valid', page.text.localize('verification token')));
          }
        }

        // Amount
        if(!isRequiredError(fieldIDs.txtAmount)){
            if(!(/^\d+(\.\d+)?$/).test(amount) || !$.isNumeric(amount)) {
                showError(fieldIDs.txtAmount, Content.errorMessage('reg', [numbers]));
            }
            else if(!(/^\d+(\.\d{1,2})?$/).test(amount)) {
                showError(fieldIDs.txtAmount, page.text.localize('Only 2 decimal points are allowed.'));
            }
            else if(amount < minAmount) {
                showError(fieldIDs.txtAmount, page.text.localize('Invalid amount, minimum is') + ' ' + withdrawCurrency + ' ' + minAmount);
            }
            else if(amount > maxAmount) {
                showError(fieldIDs.txtAmount, page.text.localize('Invalid amount, maximum is') + ' ' + withdrawCurrency + ' ' + maxAmount);
            }
        }

        // Description
        if(!(/^[a-zA-Z0-9\s\.\,\-']*$/).test(desc)) {
            showError(fieldIDs.txtDesc, Content.errorMessage('reg', [letters, numbers, space, period, comma, '- \'']));
        }

        if(isValid) {
            return {
                agent             : agent,
                agentname         : $(fieldIDs.ddlAgents + ' option:selected').text(),
                currency          : withdrawCurrency,
                amount            : amount,
                desc              : desc,
                verificationCode : token
            };
        }
        else {
            return false;
        }
    };

    var isRequiredError = function(fieldID) {
        if(!$(fieldID).val() || !(/.+/).test($(fieldID).val().trim())){
            showError(fieldID, Content.errorMessage('req'));
            return true;
        } else {
            return false;
        }
    };

    var isCountError = function(fieldID, min, max) {
        var fieldValue = $(fieldID).val().trim();
        if((fieldValue.length > 0 && fieldValue.length < min) || fieldValue.length > max) {
            showError(fieldID, Content.errorMessage('range', '(' + min + '-' + max + ')'));
            return true;
        } else {
            return false;
        }
    };

    // ----------------------------
    // ----- Withdraw Process -----
    // ----------------------------
    var withdrawRequest = function(isDryRun) {
        var dry_run = isDryRun ? 1 : 0;
        BinarySocket.send({
            "paymentagent_withdraw" : 1,
            "paymentagent_loginid"  : formData.agent,
            "currency"              : formData.currency,
            "amount"                : formData.amount,
            "description"           : formData.desc,
            "dry_run"               : dry_run,
            "verification_code"     : formData.verificationCode
        });
    };

    var withdrawResponse = function(response) {
        var responseCode = response.paymentagent_withdraw;
        switch(responseCode){
            case 2: // dry_run success: showing the confirmation page
                setActiveView(viewIDs.confirm);

                $('#lblAgentName').text(formData.agentname);
                $('#lblCurrency').text(formData.currency);
                $('#lblAmount').text(formData.amount);

                $(viewIDs.confirm + ' #btnConfirm').click(function(){
                    withdrawRequest(false);
                });
                $(viewIDs.confirm + ' #btnBack').click(function(){
                    setActiveView(viewIDs.form);
                });
                break;

            case 1: // withdrawal success
                setActiveView(viewIDs.success);
                $('#successMessage').css('display', '')
                    .attr('class', 'success-msg')
                    .html(
                        '<ul class="checked"><li>' +
                        page.text.localize('Your request to withdraw [_1] [_2] from your account [_3] to Payment Agent [_4] account has been successfully processed.', [
                            formData.currency,
                            formData.amount,
                            Cookies.get('loginid'),
                            formData.agentname,
                        ]) +
                        '</li></ul>'
                    );
                break;

            default: // error
                if(response.echo_req.dry_run === 1) {
                    setActiveView(viewIDs.form);
                    $('#formMessage').css('display', '')
                        .attr('class', errorClass)
                        .html(response.error.message);
                } else if (response.error.code === 'InvalidToken') {
                    showPageError(template(Content.localize().textClickHereToRestart, [page.url.url_for('paymentagent/withdrawws')]));
                } else {
                    showPageError(response.error.message);
                }
                break;
        }
    };

    // -----------------------------
    // ----- Message Functions -----
    // -----------------------------
    var showPageError = function(errMsg, id) {
        $(viewIDs.error + ' > p').addClass(hiddenClass);
        if(id) {
            $(viewIDs.error + ' #' + id).removeClass(hiddenClass);
        } else {
            $(viewIDs.error + ' #custom-error').html(errMsg).removeClass(hiddenClass);
        }
        setActiveView(viewIDs.error);
    };

    var showError = function(fieldID, errMsg) {
        $(fieldID).parent().append($('<p/>', {class: errorClass, text: errMsg}));
        isValid = false;
    };

    var clearError = function(fieldID) {
        $(fieldID ? fieldID : viewIDs.form + ' .' + errorClass).remove();
    };

    // ----- View Control -----
    var setActiveView = function(viewID) {
        $views.addClass(hiddenClass);
        $(viewID).removeClass(hiddenClass);
    };

    var lock_withdrawal = function(withdrawal_locked) {
      if (withdrawal_locked === 'locked') {
        showPageError('', 'withdrawal-locked-error');
      } else if (!page.client.is_virtual()) {
        BinarySocket.send({"paymentagent_list": Cookies.get('residence')});
      }
    };

    var checkOnLoad = function() {
        BinarySocket.init({
            onmessage: function(msg) {
                var response = JSON.parse(msg.data);
                if (response) {
                    var type = response.msg_type;
                    switch(type){
                        case "authorize":
                            PaymentAgentWithdrawWS.init();
                            break;
                        case "paymentagent_list":
                            PaymentAgentWithdrawWS.populateAgentsList(response);
                            break;
                        case "paymentagent_withdraw":
                            PaymentAgentWithdrawWS.withdrawResponse(response);
                            break;
                        default:
                            break;
                    }
                }
            }
        });

        Content.populate();
        if(TUser.get().hasOwnProperty('is_virtual') || page.client_status_detected('withdrawal_locked, cashier_locked', 'any')) {
            PaymentAgentWithdrawWS.init();
        } else if (sessionStorage.getItem('client_status') === null) {
          BinarySocket.send({"get_account_status": "1", "passthrough":{"dispatch_to":"PaymentAgentWithdrawWS"}});
        }
    };

    return {
        init: init,
        populateAgentsList: populateAgentsList,
        withdrawResponse: withdrawResponse,
        lock_withdrawal: lock_withdrawal,
        checkOnLoad: checkOnLoad
    };
}());

module.exports = {
    PaymentAgentWithdrawWS: PaymentAgentWithdrawWS,
};
