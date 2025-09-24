$(document).ready(function() {

  (() => {
    const btnSubmitMainForm = document.getElementById('btn-submit-main-form');
    const validationPopup = document.getElementById('validationPopup');
    const popupIcon = document.getElementById('popupIcon');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    const popupCloseBtn = document.getElementById('popupCloseBtn');
    const otpPopup = document.getElementById('otpPopup');
    const countdownElement = document.getElementById("countdown");
    const btnChangePhone = document.getElementById("btn-change-phone");
    const otpMainInput = document.getElementById('otp-input-main');

    let countdownInterval;
    let isOtpFailed = false;
    function showPopup({ type, title, messages = [], customText = '', iconSrc, buttonSrc, buttonAlt }) {
      popupTitle.textContent = title;
      popupTitle.style.color = (type === 'error') ? '#ED1C24' : '#00A651';
      popupIcon.src = iconSrc;
      popupIcon.alt = title;
      const btnImg = popupCloseBtn.querySelector('img');
      btnImg.src = buttonSrc;
      btnImg.alt = buttonAlt;
      let messageHtml = '';
      if (messages.length > 0) {
        const listItems = messages.map(msg => `<li>${msg}</li>`).join('');
        messageHtml += `<ul class="popup-error-list">${listItems}</ul>`;
      }
      if (customText) { messageHtml += `<p>${customText}</p>`; }
      if (type === 'error' && messages.length > 0) {
        messageHtml += '<p>Quý khách vui lòng kiểm tra lại thông tin.</p>';
      }
      popupMessage.innerHTML = messageHtml;
      validationPopup.classList.add('is-visible');
    }

    function closeAllPopups() {
      validationPopup.classList.remove('is-visible');
      otpPopup.classList.remove('is-visible');
      clearInterval(countdownInterval);
    }

    function validate(formData) {
      let rs = { valid: true, msg: "" };
      let message = "";
      let comma = ", ";
      if (!formData.idCard) {
        rs.valid = false;
        message += "Số CCCD là bắt buộc";
      } else if (!lib.validateIdCard(formData.idCard)) {
        rs.valid = false;
        message += "Số CCCD không đúng định dạng";
      } else if (!lib.validateIdCardToRegister(formData.idCard).isValid) {
        rs.valid = false;
        message += "Độ tuổi theo số CCCD của Quý khách không nằm trong độ tuổi được cung cấp khoản vay";
      }
      if (!formData.name) {
        if (message) message += comma;
        rs.valid = false;
        message += "Họ và Tên là bắt buộc";
      }
      if (!formData.phone) {
        if (message) message += comma;
        rs.valid = false;
        message += "Số điện thoại là bắt buộc";
      } else if (!lib.validatePhoneNumber(formData.phone)) {
        if (message) message += comma;
        rs.valid = false;
        message += "Số điện thoại không đúng định dạng";
      }
      rs.msg = message;
      return rs;
    }

    function uuidv4() {
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
          (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      );
    }

    function startCountdown() {
      const countdownTimeInMinutes = 5;
      const endTime = new Date().getTime() + countdownTimeInMinutes * 60 * 1000;
      function updateCountdown() {
        const currentTime = new Date().getTime();
        const timeDifference = endTime - currentTime;
        if (timeDifference > 0) {
          const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
          countdownElement.innerHTML = `(SMS) ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        } else {
          clearInterval(countdownInterval);
          countdownElement.innerHTML = "Mã OTP đã hết hạn!";
          closeAllPopups();
        }
      }
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    }

    function sendWarehouseProcessRequest(prevForm, otpStatus = "Thất bại") {
      // grecaptcha.ready(function () {
      //   grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", { action: "submit" }).then(function (token) {
          let formData = $(prevForm).getValue();
          const requestData = {
            custName: formData.name,
            idCard: formData.idCard,
            phoneNumber: formData.phone,
            custAddress: "",
            salaryType: "",
            timeCall: "",
            otpStatus: otpStatus,
            cicStatus: "",
            obtStatus: "",
            metadata: "",
            createdDate: ""
          };
          lib.post({
            url: `${env.backEndApi}/api/warehouse/process`,
            // token: token,
            data: JSON.stringify(requestData),
            complete: function (response) { console.log("Warehouse log sent:", response); },
            error: function (error) { console.error("Warehouse log failed:", error); }
          });
      //   });
      // });
    }

    function genOtp(prevForm) {
      isOtpFailed = false;
      // grecaptcha.ready(function () {
      //   grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", { action: "submit" }).then(function (token) {
          let formData = $(prevForm).getValue();
          let dataValidate = { request_id: uuidv4(), contact_number: formData.phone };
          lib.post({
            url: `${env.backEndApi}/api/lead/validate`,
            // token: token,
            data: JSON.stringify(dataValidate),
            complete: function (response) {
              let dataRes = response.responseJSON;
              if (dataRes.rslt_cd === 's' && dataRes.reason_code === '0') {
                // grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", { action: "submit" }).then(function (tokenOtp) {
                  let dataOtp = { TransId: uuidv4(), Data: { phone: formData.phone, idCard: formData.idCard } };
                  lib.post({
                    url: `${env.backEndApi}/api/otp/gen-otp`,
                    // token: tokenOtp,
                    data: JSON.stringify(dataOtp),
                    complete: function (otpResponse) {
                      let otpDataRes = otpResponse.responseJSON;
                      if (otpDataRes.data.result.status && otpDataRes.data.result.value) {
                        document.getElementById('prev-form').value = prevForm;
                        otpPopup.classList.add('is-visible');
                        startCountdown();
                      } else {
                        showPopup({ type: 'error', title: 'Thất bại', customText: 'Tạo Mã OTP không thành công. Vui lòng thử lại sau.', iconSrc: '/images/block.png', buttonSrc: '/images/back-btn.png', buttonAlt: 'Quay lại' });
                      }
                    },
                    error: function(err) { showPopup({ type: 'error', title: 'Thất bại', customText: 'Có lỗi xảy ra khi tạo OTP. Vui lòng thử lại!', iconSrc: '/images/block.png', buttonSrc: '/images/back-btn.png', buttonAlt: 'Quay lại' }); }
                  });
                // });
              } else {
                showPopup({ type: 'error', title: 'Thất bại', customText: 'Số điện thoại của Quý khách đã có trong hệ thống. Vui lòng gọi Hotline 1900 633 070 để được hỗ trợ!', iconSrc: '/images/block.png', buttonSrc: '/images/back-btn.png', buttonAlt: 'Quay lại' });
              }
            },
            error: function (ex) { showPopup({ type: 'error', title: 'Thất bại', customText: 'Số điện thoại của Quý khách đã có trong hệ thống. Vui lòng gọi Hotline 1900 633 070 để được hỗ trợ!', iconSrc: '/images/block.png', buttonSrc: '/images/back-btn.png', buttonAlt: 'Quay lại' }); }
          });
      //   });
      // });
    }

    function verifyOtp(otpDegit) {
      // grecaptcha.ready(function () {
      //   grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", { action: "submit" }).then(function (token) {
          let formId = $('#prev-form').val();
          let formData = $(formId).getValue();

          let otpCode = `${otpDegit.code01}${otpDegit.code02}${otpDegit.code03}${otpDegit.code04}${otpDegit.code05}${otpDegit.code06}`;
          let dataOtp = {
            TransId: uuidv4(),
            Data: { phone: formData.phone, otp: otpCode }
          };

          lib.post({
            // token: token,
            url: `${env.backEndApi}/api/otp/verify-otp`,
            data: JSON.stringify(dataOtp),
            complete: function (response) {
              let dataRes = response.responseJSON;
              if (dataRes.data.result.status && dataRes.data.result.value && dataRes.data.result.authentication === 'ACCEPT') {
                isOtpFailed = false;

                // grecaptcha.ready(function () {
                //   grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", { action: "submit" }).then(function (tokenLead) {
                    var urlSearchParams = new URLSearchParams(window.location.search);
                    var submitdata = urlSearchParams.get('utm_source');
                    var utmMedium = urlSearchParams.get('utm_medium');
                    var utmCampaign = urlSearchParams.get('utm_campaign');
                    var utmContent = urlSearchParams.get('utm_content');

                    var gclid = urlSearchParams.get('gclid');
                    var fbclid = urlSearchParams.get('fbclid');
                    var ttclid = urlSearchParams.get('ttclid');
                    var clickId = '';
                    if (gclid) {
                      clickId = gclid;
                    } else if (fbclid) {
                      clickId = fbclid;
                    } else if (ttclid) {
                      clickId = ttclid;
                    }

                    var dataNote = {
                      cmnd: formData.idCard,
                      province: formData.livingPlace,
                      score: utmMedium,
                      isdn: utmCampaign,
                      income_amount: null,
                      email: null,
                      gender: null,
                      submitdata: submitdata,
                      oldloan: utmContent,
                      income: null,
                      company: clickId,
                      obt: "OTP thành công",
                      personalData: "Đồng ý để LFVN sử dụng DLCN cho mục đích quảng cáo, truyền thông"
                    };

                    let data = {
                      request_id: uuidv4(),
                      device: "01",
                      fullname: formData.name,
                      birthday: null,
                      contact_number: formData.phone,
                      note: JSON.stringify(dataNote),
                    };

                    lib.post({
                      // token: tokenLead,
                      url: `${env.backEndApi}/api/lead/send`,
                      data: JSON.stringify(data),
                      complete: function (response) {
                        sendWarehouseProcessRequest(formId, "Thành công");
                        closeAllPopups();
                        showPopup({
                          type: 'success',
                          title: 'Thành công',
                          customText: 'Cảm ơn Quý khách đã đăng ký thông tin. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất!',
                          iconSrc: '/images/success-icon.png',
                          buttonSrc: '/images/close-btn.png',
                          buttonAlt: 'Đóng'
                        });
                        $(formId)[0].reset();
                      },
                      error: function (ex) {
                        closeAllPopups();
                        showPopup({ type: 'error', title: 'Thất bại', customText: 'Đăng ký chưa thành công, vui lòng kiểm tra lại thông tin.', iconSrc: '/images/block.png', buttonSrc: '/images/back-btn.png', buttonAlt: 'Quay lại' });
                      },
                    });
                //   });
                // });

              } else {
                // OTP SAI
                isOtpFailed = true;
                closeAllPopups();
                showPopup({ type: 'error', title: 'Thất bại', customText: 'OTP của Quý khách nhập chưa đúng hoặc đã hết hạn sử dụng. Vui lòng thử lại!', iconSrc: '/images/block.png', buttonSrc: '/images/back-btn.png', buttonAlt: 'Quay lại' });
                if(otpMainInput) otpMainInput.value = '';
              }
            },
            error: function (ex) {
              isOtpFailed = true;
              closeAllPopups();
              showPopup({ type: 'error', title: 'Thất bại', customText: 'Xác thực OTP chưa thành công. Quý khách vui lòng thử lại!', iconSrc: '/images/block.png', buttonSrc: '/images/back-btn.png', buttonAlt: 'Quay lại' });
              if(otpMainInput) otpMainInput.value = '';
            },
          });
      //   });
      // });
    }


    if (btnSubmitMainForm) {
      btnSubmitMainForm.addEventListener("click", (e) => {
        e.preventDefault();
        let formId = '#apply-form';
        let formData = $(formId).getValue();
        let rsValidate = validate(formData);
        if (!rsValidate.valid) {
          const errorMessages = rsValidate.msg.split(/, /).filter(msg => msg.trim() !== '');
          showPopup({ type: 'error', title: 'Thất bại', messages: errorMessages, iconSrc: '/images/block.png', buttonSrc: '/images/back-btn.png', buttonAlt: 'Quay lại' });
          return;
        }
        if (!formData.i_agree_terms_and_conditions) {
          showPopup({ type: 'error', title: 'Thất bại', messages: ['Quý khách vui lòng đồng ý với chính sách & điều khoản dịch vụ!'], iconSrc: '/images/block.png', buttonSrc: '/images/back-btn.png', buttonAlt: 'Quay lại' });
          return;
        }
        sendWarehouseProcessRequest(formId);
        genOtp(formId);
      });
    }

    if (otpMainInput) {
      otpMainInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length === 6) {
          const otpDigits = this.value.split('');
          const otpObject = { code01: otpDigits[0], code02: otpDigits[1], code03: otpDigits[2], code04: otpDigits[3], code05: otpDigits[4], code06: otpDigits[5] };
          verifyOtp(otpObject);
        }
      });
    }
    popupCloseBtn.addEventListener('click', (e) => { e.preventDefault(); closeAllPopups(); });
    validationPopup.addEventListener('click', (e) => { if (e.target === validationPopup) closeAllPopups(); });
    otpPopup.addEventListener('click', (e) => { if (e.target === otpPopup) closeAllPopups(); });
    btnChangePhone.addEventListener('click', (e) => { e.preventDefault(); closeAllPopups(); });
  })();

});