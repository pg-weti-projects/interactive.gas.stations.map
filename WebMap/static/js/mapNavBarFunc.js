// File contains all functions related to navigation bar on the main web page

// Adding new alerts.
function showAlert(message, type) {
    const alertDiv = $('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">'
        + message + '</div>');

    $('#alert-container').append(alertDiv);

    alertDiv.css('opacity', 1);

    // Set new alert relative to last one ( if existing )
    if ($('.alert').length > 1) {
    const lastAlert = $('.alert').eq(-2);
    const lastAlertTop = parseInt(lastAlert.css('top'));
    alertDiv.css('top', (lastAlertTop) + 'px');
    }

    // delay of hiding alert
    setTimeout(function() {
        alertDiv.css('opacity', 0);
        alertDiv.alert('close');
    }, 5000);
}