$(document).ready(function () {

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

        function showPopup({type, title, messages = [], customText = '', iconSrc, buttonSrc, buttonAlt}) {
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
            if (customText) {
                messageHtml += `<p>${customText}</p>`;
            }
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
            let rs = {valid: true, msg: ""};
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
            return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
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
            //     grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", {action: "submit"}).then(function (token) {
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
                        url: `http://localhost:8080/api/warehouse/process`,
                        // token: token,
                        data: JSON.stringify(requestData),
                        complete: function (response) {
                            console.log("Warehouse log sent:", response);
                        },
                        error: function (error) {
                            console.error("Warehouse log failed:", error);
                        }
                    });
                // });
            // });
        }

        function genOtp(prevForm) {
            isOtpFailed = false;
            // grecaptcha.ready(function () {
            //     grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", {action: "submit"}).then(function (token) {
                    let formData = $(prevForm).getValue();
                    let dataValidate = {request_id: uuidv4(), contact_number: formData.phone};
                    lib.post({
                        url: `http://localhost:8080/api/lead/validate`,
                        // token: token,
                        data: JSON.stringify(dataValidate),
                        complete: function (response) {
                            let dataRes = response.responseJSON;
                            if (dataRes.rslt_cd === 's' && dataRes.reason_code === '0') {
                                // grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", {action: "submit"}).then(function (tokenOtp) {
                                    let dataOtp = {
                                        TransId: uuidv4(), Data: {phone: formData.phone, idCard: formData.idCard}
                                    };
                                    lib.post({
                                        url: `http://localhost:8080/api/otp/gen-otp`,
                                        // token: tokenOtp,
                                        data: JSON.stringify(dataOtp),
                                        complete: function (otpResponse) {
                                            let otpDataRes = otpResponse.responseJSON;
                                            if (otpDataRes.data.result.status && otpDataRes.data.result.value) {
                                                document.getElementById('prev-form').value = prevForm;
                                                otpPopup.classList.add('is-visible');
                                                startCountdown();
                                            } else {
                                                showPopup({
                                                    type: 'error',
                                                    title: 'Thất bại',
                                                    customText: 'Tạo Mã OTP không thành công. Vui lòng thử lại sau.',
                                                    iconSrc: 'images/block.png',
                                                    buttonSrc: 'images/back-btn.png',
                                                    buttonAlt: 'Quay lại'
                                                });
                                            }
                                        },
                                        error: function (err) {
                                            showPopup({
                                                type: 'error',
                                                title: 'Thất bại',
                                                customText: 'Có lỗi xảy ra khi tạo OTP. Vui lòng thử lại!',
                                                iconSrc: 'images/block.png',
                                                buttonSrc: 'images/back-btn.png',
                                                buttonAlt: 'Quay lại'
                                            });
                                        }
                                    });
                                // });
                            } else {
                                showPopup({
                                    type: 'error',
                                    title: 'Thất bại',
                                    customText: 'Số điện thoại của Quý khách đã có trong hệ thống. Vui lòng gọi Hotline 1900 633 070 để được hỗ trợ!',
                                    iconSrc: 'images/block.png',
                                    buttonSrc: 'images/back-btn.png',
                                    buttonAlt: 'Quay lại'
                                });
                            }
                        },
                        error: function (ex) {
                            showPopup({
                                type: 'error',
                                title: 'Thất bại',
                                customText: 'Số điện thoại của Quý khách đã có trong hệ thống. Vui lòng gọi Hotline 1900 633 070 để được hỗ trợ!',
                                iconSrc: 'images/block.png',
                                buttonSrc: 'images/back-btn.png',
                                buttonAlt: 'Quay lại'
                            });
                        }
                    });
                // });
            // });
        }

        function verifyOtp(otpDegit) {
            // grecaptcha.ready(function () {
            //     grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", {action: "submit"}).then(function (token) {
                    let formId = $('#prev-form').val();
                    let formData = $(formId).getValue();

                    let otpCode = `${otpDegit.code01}${otpDegit.code02}${otpDegit.code03}${otpDegit.code04}${otpDegit.code05}${otpDegit.code06}`;
                    let dataOtp = {
                        TransId: uuidv4(), Data: {phone: formData.phone, otp: otpCode}
                    };

                    lib.post({
                        // token: token,
                        url: `http://localhost:8080/api/otp/verify-otp`,
                        data: JSON.stringify(dataOtp),
                        complete: function (response) {
                            let dataRes = response.responseJSON;
                            if (dataRes.data.result.status && dataRes.data.result.value && dataRes.data.result.authentication === 'ACCEPT') {
                                isOtpFailed = false;

                                // grecaptcha.ready(function () {
                                //     grecaptcha.execute("GOOGLE_SITE_KEY_TEMP", {action: "submit"}).then(function (tokenLead) {
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
                                            url: `http://localhost:8080/api/lead/send`,
                                            data: JSON.stringify(data),
                                            complete: function (response) {
                                                sendWarehouseProcessRequest(formId, "Thành công");
                                                closeAllPopups();
                                                showPopup({
                                                    type: 'success',
                                                    title: 'Thành công',
                                                    customText: 'Cảm ơn Quý khách đã đăng ký thông tin. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất!',
                                                    iconSrc: 'images/success-icon.png',
                                                    buttonSrc: 'images/close-btn.png',
                                                    buttonAlt: 'Đóng'
                                                });
                                                $(formId)[0].reset();
                                            },
                                            error: function (ex) {
                                                closeAllPopups();
                                                showPopup({
                                                    type: 'error',
                                                    title: 'Thất bại',
                                                    customText: 'Đăng ký chưa thành công, vui lòng kiểm tra lại thông tin.',
                                                    iconSrc: 'images/block.png',
                                                    buttonSrc: 'images/back-btn.png',
                                                    buttonAlt: 'Quay lại'
                                                });
                                            },
                                        });
                                    // });
                                // });

                            } else {
                                // OTP SAI
                                isOtpFailed = true;
                                closeAllPopups();
                                showPopup({
                                    type: 'error',
                                    title: 'Thất bại',
                                    customText: 'OTP của Quý khách nhập chưa đúng hoặc đã hết hạn sử dụng. Vui lòng thử lại!',
                                    iconSrc: 'images/block.png',
                                    buttonSrc: 'images/back-btn.png',
                                    buttonAlt: 'Quay lại'
                                });
                                if (otpMainInput) otpMainInput.value = '';
                            }
                        },
                        error: function (ex) {
                            isOtpFailed = true;
                            closeAllPopups();
                            showPopup({
                                type: 'error',
                                title: 'Thất bại',
                                customText: 'Xác thực OTP chưa thành công. Quý khách vui lòng thử lại!',
                                iconSrc: 'images/block.png',
                                buttonSrc: 'images/back-btn.png',
                                buttonAlt: 'Quay lại'
                            });
                            if (otpMainInput) otpMainInput.value = '';
                        },
                    });
                // });
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
                    showPopup({
                        type: 'error',
                        title: 'Thất bại',
                        messages: errorMessages,
                        iconSrc: 'images/block.png',
                        buttonSrc: 'images/back-btn.png',
                        buttonAlt: 'Quay lại'
                    });
                    return;
                }
                if (!formData.i_agree_terms_and_conditions) {
                    showPopup({
                        type: 'error',
                        title: 'Thất bại',
                        messages: ['Quý khách vui lòng đồng ý với chính sách & điều khoản dịch vụ!'],
                        iconSrc: 'images/block.png',
                        buttonSrc: 'images/back-btn.png',
                        buttonAlt: 'Quay lại'
                    });
                    return;
                }
                sendWarehouseProcessRequest(formId);
                genOtp(formId);
            });
        }

        if (otpMainInput) {
            otpMainInput.addEventListener('input', function () {
                this.value = this.value.replace(/\D/g, '');
                if (this.value.length === 6) {
                    const otpDigits = this.value.split('');
                    const otpObject = {
                        code01: otpDigits[0],
                        code02: otpDigits[1],
                        code03: otpDigits[2],
                        code04: otpDigits[3],
                        code05: otpDigits[4],
                        code06: otpDigits[5]
                    };
                    verifyOtp(otpObject);
                }
            });
        }
        popupCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllPopups();
        });
        validationPopup.addEventListener('click', (e) => {
            if (e.target === validationPopup) closeAllPopups();
        });
        otpPopup.addEventListener('click', (e) => {
            if (e.target === otpPopup) closeAllPopups();
        });
        btnChangePhone.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllPopups();
        });
    })();

});

document.addEventListener('DOMContentLoaded', function () {

    (() => {
        const cards = Array.from(document.querySelectorAll('.loan-card'));
        if (cards.length === 0) return;

        function updateCardView(card) {
            const list = card.querySelector('.terms-list');
            const btn = card.querySelector('.js-more');
            if (!list || !btn) return;

            const cs = getComputedStyle(list);
            const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.5);
            const collapsedHeight = Math.ceil(lh * 3);
            list.style.setProperty('--terms-collapsed', collapsedHeight + 'px');

            const needsToggle = list.scrollHeight > collapsedHeight + 5;
            btn.hidden = !needsToggle;

            btn.innerHTML = card.classList.contains('terms-open') ? 'Thu gọn <i class="bi bi-chevron-up"></i>' : 'Xem thêm <i class="bi bi-chevron-down"></i>';
        }

        cards.forEach(card => {
            const btn = card.querySelector('.js-more');
            if (btn) {
                btn.addEventListener('click', () => {
                    card.classList.toggle('terms-open');
                    updateCardView(card);
                });
            }
            updateCardView(card);
        });

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => cards.forEach(updateCardView));
        }
        window.addEventListener('resize', () => cards.forEach(updateCardView));
    })();

    (() => {
        const ranges = document.querySelectorAll('.calc-range');
        if (ranges.length === 0) return;

        const setFill = el => {
            const percent = ((el.value - el.min) / (el.max - el.min)) * 100;
            el.style.setProperty('--p', percent + '%');
        };

        ranges.forEach(range => {
            setFill(range);
            range.addEventListener('input', () => setFill(range));
        });
    })();

    (() => {
        const faqQuestions = document.querySelectorAll('.faq-item .faq-q');
        if (faqQuestions.length === 0) return;

        faqQuestions.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const item = this.closest('.faq-item');
                if (!item) return;
                const isOpen = item.classList.toggle('is-open');
                this.setAttribute('aria-expanded', isOpen);
            });
        });
    })();

    (() => {
        const amtSlider = document.getElementById('amt');
        const monSlider = document.getElementById('mon');
        if (!amtSlider || !monSlider) return;

        const amtLabel = document.getElementById('amtLabel');
        const monLabel = document.getElementById('monLabel');
        const moneyResult = document.getElementById('money');

        function formatVND(value) {
            return Number(value).toLocaleString('vi-VN') + ' VND';
        }

        function calculatePMT(rate, nper, pv) {
            if (rate === 0) return -(pv / nper);
            const pvif = Math.pow(1 + rate, nper);
            return (rate * pv * pvif) / (pvif - 1);
        }

        function updateLoanCalculation() {
            const loanAmount = Number(amtSlider.value);
            const loanTerm = Number(monSlider.value);

            amtLabel.textContent = formatVND(loanAmount).replace(' VND', '');
            monLabel.textContent = loanTerm + ' tháng';

            const annualRate = 0.18;
            const monthlyRate = annualRate / 12;
            const monthlyPayment = calculatePMT(monthlyRate, loanTerm, -loanAmount);
            const displayPayment = Math.abs(monthlyPayment);
            const roundedPayment = Math.round(displayPayment / 1000) * 1000;
            moneyResult.textContent = formatVND(roundedPayment);
        }

        amtSlider.addEventListener('input', updateLoanCalculation);
        monSlider.addEventListener('input', updateLoanCalculation);
        updateLoanCalculation();
    })();


    (() => {
        const processTrack = document.querySelector('#quy-trinh .process-grid.fixed-card');
        if (processTrack) processTrack.scrollTo({left: 0, behavior: 'instant'});

        const newsTrack = document.querySelector('.press-section .news-grid');
        if (newsTrack) newsTrack.scrollTo({left: 0, behavior: 'instant'});

        const processSlider = document.querySelector('.process-grid.fixed-card');
        const dotsContainer = document.querySelector('.process-dots');
        if (processSlider && dotsContainer) {
            const dots = Array.from(dotsContainer.children);
            const cards = Array.from(processSlider.children);
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const visibleCardIndex = cards.indexOf(entry.target);
                        dots.forEach((dot, index) => {
                            dot.classList.toggle('is-active', index === visibleCardIndex);
                        });
                    }
                });
            }, {root: processSlider, threshold: 0.51});

            cards.forEach(card => observer.observe(card));
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    cards[index].scrollIntoView({behavior: 'smooth', inline: 'start', block: 'nearest'});
                });
            });
        }

        const testiTrack = document.querySelector('.testi-section .testi-grid');
        const prevBtn = document.querySelector('.testi-section .testi-prev');
        const nextBtn = document.querySelector('.testi-section .testi-next');
        if (testiTrack && prevBtn && nextBtn) {
            const scrollSlider = (direction) => {
                const card = testiTrack.querySelector('.testi-card');
                if (!card) return;
                const scrollAmount = card.offsetWidth + parseInt(getComputedStyle(testiTrack).gap);
                testiTrack.scrollBy({left: scrollAmount * direction, behavior: 'smooth'});
            };
            nextBtn.addEventListener('click', () => scrollSlider(1));
            prevBtn.addEventListener('click', () => scrollSlider(-1));
        }
    })();


    // --- Chức năng 6: Xử lý menu hamburger trên mobile ---
    (() => {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const body = document.body;
        if (!hamburgerBtn) return;

        hamburgerBtn.addEventListener('click', () => {
            const isExpanded = body.classList.toggle('menu-is-open');
            hamburgerBtn.setAttribute('aria-expanded', isExpanded);
        });

        const menuLinks = document.querySelectorAll('.main-menu a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                body.classList.remove('menu-is-open');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            });
        });
    })();


    // --- Chức năng 7: Bộ đếm số khách hàng tự động ---
    (() => {
        const counterWidget = document.querySelector('.lf-sticky-cta .lf-counter');
        const counterContainer = document.getElementById('scrolling-counter');
        if (!counterWidget || !counterContainer) return;

        let continuousUpdateInterval = null;
        const startDate = new Date('2025-08-06T00:00:00+07:00');
        const startValue = 396750;
        const incrementPerDay = 15000;
        const minValue = 800000;
        const maxValue = 1000000;
        const MS_PER_DAY = 86400000;

        const wrapToRange = (val) => {
            const range = maxValue - minValue;
            return ((val - minValue) % range + range) % range + minValue;
        };

        const calculatePreciseCurrentValue = () => {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const elapsedFullDays = Math.max(0, Math.floor((todayStart.getTime() - startDate.getTime()) / MS_PER_DAY));
            const baseValueForToday = startValue + (elapsedFullDays * incrementPerDay);
            const msPassedToday = now.getTime() - todayStart.getTime();
            const fractionOfDayPassed = msPassedToday / MS_PER_DAY;
            const incrementToday = fractionOfDayPassed * incrementPerDay;
            const rawValue = baseValueForToday + incrementToday;
            return rawValue >= maxValue ? wrapToRange(rawValue) : rawValue;
        };

        const createCounterStructure = (valueString) => {
            counterContainer.innerHTML = '';
            for (let char of valueString) {
                if (!isNaN(parseInt(char))) {
                    const digitRoller = document.createElement('div');
                    digitRoller.className = 'digit-roller';
                    let innerHTML = '';
                    for (let i = 0; i <= 9; i++) innerHTML += `<span>${i}</span>`;
                    digitRoller.innerHTML = innerHTML;
                    counterContainer.appendChild(digitRoller);
                } else {
                    const separator = document.createElement('div');
                    separator.className = 'digit-separator';
                    separator.textContent = char;
                    counterContainer.appendChild(separator);
                }
            }
        };

        const updateCounterDisplay = (targetValue) => {
            const targetString = Math.floor(targetValue).toLocaleString('vi-VN');
            const digitHeight = 20;

            if (targetString.length !== counterContainer.querySelectorAll('.digit-roller, .digit-separator').length) {
                createCounterStructure(targetString);
            }

            const digitRollers = counterContainer.querySelectorAll('.digit-roller');
            let rollerIndex = 0;
            for (let char of targetString) {
                if (!isNaN(parseInt(char))) {
                    const digit = parseInt(char);
                    const roller = digitRollers[rollerIndex];
                    if (roller) {
                        roller.style.transform = `translateY(-${digit * digitHeight}px)`;
                    }
                    rollerIndex++;
                }
            }
        };

        const initialValue = calculatePreciseCurrentValue();
        createCounterStructure(Math.floor(initialValue).toLocaleString('vi-VN'));
        updateCounterDisplay(initialValue);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!continuousUpdateInterval) {
                        continuousUpdateInterval = setInterval(() => {
                            updateCounterDisplay(calculatePreciseCurrentValue());
                        }, 1000);
                    }
                } else {
                    clearInterval(continuousUpdateInterval);
                    continuousUpdateInterval = null;
                }
            });
        }, {threshold: 0.1});

        observer.observe(counterWidget);
    })();


    (() => {
        const singleLoanKey = document.body.dataset.pageLoan;
        const multipleLoanKeys = document.body.dataset.pageLoans;

        if (!singleLoanKey && !multipleLoanKeys) return;

        const keysToShow = multipleLoanKeys ? multipleLoanKeys.split(',').map(key => key.trim()) : [singleLoanKey];

        if (window.matchMedia("(max-width: 991.98px)").matches) {
            const mainContainer = document.getElementById('board');
            const loanSection = document.getElementById('goi-vay');

            if (!mainContainer || !loanSection) return;

            keysToShow.reverse().forEach(key => {
                const card = loanSection.querySelector(`.loan-card[data-loan="${key}"]`);
                if (card) {
                    card.classList.add('is-active-detail');
                    card.classList.add('terms-open');
                    const moreButton = card.querySelector('.js-more');
                    if (moreButton) {
                        moreButton.remove();
                    }

                    mainContainer.prepend(card);
                }
            });

            loanSection.hidden = true;

            const prependedCards = mainContainer.querySelectorAll(':scope > .loan-card.is-active-detail');
            if (prependedCards.length > 1) {
                Array.from(prependedCards).reverse().forEach(card => mainContainer.prepend(card));
            }
        }
    })();

});