
// $(document).ready(function() {

  var lib = new Lib();

  function Lib() {
    this.postApi = function (option) {
      if (option.beforePost) {
        option.beforePost();
      }
      $.post(option.url, option.data)
          .then(function (res) {
            lib.checkAut(res);
            if (option.complete) {
              option.complete(res);
            }
          })
          .fail(function (err) {
            lib.checkAut(err);
            if (option.error) {
              option.error(err);
            }
          });
    };

    this.post = function (option) {
      if (option.beforePost) {
        option.beforePost();
      }
      $.ajax({
        type: "POST",
        contentType: "application/json",
        url: option.url,
        data: option.data,
        headers: {
          "api-key": "Dejwak-mevped-8zoffi",
          "captcha-response": option.token,
          "channel": 'N4apCjIFjujAGEyFGVBCnQ=='
        },
        dataType: 'json',
        complete: function (response) {
          try {
            if (response.responseJSON?.rslt_msg === 'Success' || response.responseJSON?.errorMessage == "Successful") {
              if (option.complete) {
                option.complete(response);
              }
            } else {
              if (option.error) {
                option.error(response);
              }
            }
          } catch (e) {
            lib.showToast({
              type: 'error',
              title: 'Thất bại',
              message: 'Gửi thông tin thất bại. Vui lòng thử lại!'
            })
          }
        }
      });
    };
    this.validatePhoneNumber = function (phone) {
      const re = /^(0[3|5|7|8|9])+([0-9]{8})$/;
      return re.test(phone);
    };
    this.validateIdCard = function (idcard) {
      const re = /^\d{12}$/;
      return re.test(idcard);
    };

    this.validateIdCardToRegister = function (idcard) {
      const re = /^\d{12}$/;
      if (!re.test(idcard)) {
        return { isValid: false};
      }
      const currentYear = new Date().getFullYear();

      const centuryIndicator = parseInt(idcard[3], 10);
      const yearOfBirth = parseInt(idcard.slice(4, 6), 10);

      let fullYearOfBirth;
      if (centuryIndicator === 0 || centuryIndicator === 1) {
        fullYearOfBirth = 1900 + yearOfBirth;
      } else if (centuryIndicator === 2 || centuryIndicator === 3) {
        fullYearOfBirth = 2000 + yearOfBirth;
      } else {
        return { isValid: false};
      }

      const age = currentYear - fullYearOfBirth;

      if (age < 20 || age > 60) {
        return {
          isValid: false
        };
      }

      return { isValid: true};
    };
    this.showToast = function (option) {
      if (option.type === 'success') {
        toast({
          title: option.title,
          message: option.message,
          type: option.type,
          duration: 5000
        });
      }
      if (option.type === 'error') {
        toast({
          title: option.title,
          message: option.message,
          type: option.type,
          duration: 5000
        });
      }
    }
  }


  jQuery.fn.extend({
    getValue: function () {
      var result = {};
      var control = $(this).find(getClassInputForm());
      var controlName = [];
      for (let index = 0; index < control.length; index++) {
        var name = control[index].getAttribute('name');
        if (!controlName.find(x => x === name)) {
          controlName.push(name);
        }
      }
      for (const name of controlName) {
        var controls = $(this).find(getClassInputForm(name));
        var ctlValue = getValueControl(controls);
        if (ctlValue !== undefined) {
          result[name] = ctlValue;
        }
      }
      return result;
    },
  });

  getClassInputForm = function (name) {
    return name ?
        'input[name="' + name + '"],textarea[name="' + name + '"],select[name="' + name + '"]' :
        'input,textarea,select';
  };

  getValueControl = function (control) {
    var result;
    if (control.length === 1) {
      var type = control[0].getAttribute('type');
      switch (type) {
        case 'checkbox':
          result = control[0].checked ? true : false;
          break;
        case 'radio':
          result = control[0].checked ? true : false;
          break;
        case 'number':
          var valueInt = parseFloat(control[0].value);
          if (isNaN(valueInt)) {
            valueInt = null;
          }
          result = valueInt;
          break;
        default:
          result = control.val();
          break;
      }
    } else if (control.length > 1) {
      var type = control[0].getAttribute('type');
      switch (type) {
        case 'checkbox':
          result = getValueControlChecked(control);
          break;
        case 'radio':
          result = getValueControlRadioChecked(control);
          break;
      }
    }
    return result;

    function getValueControlChecked(control) {
      var result = [];
      for (let index = 0; index < control.length; index++) {
        const item = control[index];
        if (item.checked) {
          result.push(item.value);
        }
      }
      return result;
    }

    function getValueControlRadioChecked(control) {
      var result = "0";
      for (var index = 0; index < control.length; index++) {
        var item = control[index];
        if (item.checked) {
          result = item.value;
        }
      }
      return result;
    }
  };

  jQuery.fn.extend({
    uiLoading: function (value) {
      console.log('uiLoading:', value);
      var loading = document.getElementById("loading");
      if (loading !== null && loading !== undefined) {
        if (loading == true) {
          loading.style.display = "block"
        } else {
          loading.style.display = "none"
        }
      }
    }
  });

// }); // Đóng thẻ bọc $(document).ready()