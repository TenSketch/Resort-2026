export const PASSWORD_RESET_EMAIL_TEMPLATE = `
<div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.6; max-width: 600px; margin: 0 auto;">

    <h2 style="color: #4d9900;">Password Reset Request - vanavihari.com</h2>

    <p><em style="color: #4d9900;">Dear {{FULL_NAME}},</em></p>

    <p>
        We received a request to reset the password for your account associated with this email address.
        If you made this request, please follow the instructions below to reset your password.  
        If you did not request to reset your password, please ignore this email.
    </p>

    <p>To reset your password, click the link below or copy and paste it into your browser:</p>

    <p>
        <a href="{{RESET_LINK}}" style="color: #4d9900;">
            {{RESET_LINK}}
        </a>
    </p>

    <p>
        This link will expire in 1 hour. If the link has expired, you can request a new password reset.
    </p>

    <p>
        For your security, 
        <strong style="color: #4d9900;">please do not share this link with anyone.</strong>
    </p>

    <p>If you have any questions or need further assistance, feel free to contact our support team.</p>

    <p style="margin-top: 20px; color: #4d9900;">
        <strong>Best regards,</strong><br>
        <strong>Vanavihari Booking System</strong><br>
        <a href="http://www.vanavihari.com" style="color: #4d9900;">www.vanavihari.com</a><br>
        9840166419
    </p>
</div>
`;

export const PASSWORD_ADMIN_SEND_TEMPLATE = `
<div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);">

    <h2 style="color: #4d9900; text-align: center;">Welcome to Vanavihari!</h2>

    <p style="font-size: 16px;"><em style="color: #4d9900;">Dear {{FULL_NAME}},</em></p>

    <p style="font-size: 16px;">
        Greetings from <strong>Vanavihari</strong>!
    </p>

    <p style="font-size: 16px;">
        Your account has been successfully created by our admin team. You can now access your account and start exploring all that Vanavihari has to offer.
    </p>

    <div style="background-color: #f8f8f8; padding: 20px; border-left: 4px solid #4d9900; margin: 20px 0;">
        <h3 style="color: #4d9900; margin-top: 0;">Your Login Credentials:</h3>
        <p style="font-size: 16px; margin: 10px 0;">
            <strong>Email:</strong> {{EMAIL}}
        </p>
        <p style="font-size: 16px; margin: 10px 0;">
            <strong>Password:</strong> <span style="background-color: #fff; padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 18px; color: #333;">{{PASSWORD}}</span>
        </p>
        <p style="font-size: 16px; margin: 10px 0;">
            <strong>Email Verification Status:</strong> {{VERIFICATION_STATUS}}
        </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{LOGIN_LINK}}" 
           style="background-color: #4d9900; color: #ffffff; text-decoration: none; display: inline-block; padding: 15px 40px; font-size: 18px; border-radius: 8px; font-weight: bold;">
            LOGIN NOW
        </a>
    </div>

    <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>⚠️ Security Notice:</strong> For your security, we recommend changing your password after your first login. You can do this from your account settings.
        </p>
    </div>

    <p style="font-size: 16px;">
        If you have any questions or need assistance, feel free to reach out to us at 
        <a href="mailto:info@vanavihari.com" style="color: #4d9900; font-weight: bold;">info@vanavihari.com</a> 
        or call us at <span style="font-weight: bold;">9840166419</span>. We're here to help!
    </p>

    <p style="font-size: 16px; margin-top: 30px;">
        Best Regards,
    </p>

    <p style="font-size: 16px;">
        Team <strong>Vanavihari</strong>
    </p>

    <p style="font-size: 16px; color: #666;">
        <a href="mailto:info@vanavihari.com" style="color: #4d9900;">info@vanavihari.com</a> | 9840166419<br>
        <a href="http://www.vanavihari.com" style="color: #4d9900;">www.vanavihari.com</a>
    </p>

</div>
`;


export const EMAIL_VERIFICATION_TEMPLATE = `
<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

    <p style="font-size: 18px; color: #333333; margin-bottom: 20px; font-weight: bold;">
        Dear <span style="font-style: italic;">{{FULL_NAME}}</span>,
    </p>

    <p style="font-size: 16px; color: #333333;">
        Greetings from <strong>Vanavihari</strong>!
    </p>

    <p style="font-size: 16px; color: #333333;">
        We are thrilled to receive your registration and welcome you to our bamboo-filled paradise!  
        Just one more step remains before you can start exploring all that 
        <strong>Vanavihari</strong> has to offer.
    </p>

    <div style="text-align: center; margin-top: 30px;">
        <a href="{{VERIFICATION_LINK}}" 
           style="background-color: #4d9900; color: #ffffff; text-decoration: none; display: inline-block; padding: 15px 30px; font-size: 20px; border-radius: 8px; font-weight: bold;">
            VERIFY
        </a>
    </div>

    <p style="font-size: 16px; color: #333333; margin-top: 30px;">
        If you have any questions or need assistance, feel free to reach out to us at 
        <a href="mailto:info@vanavihari.com" style="color: #4d9900; font-weight: bold;">info@vanavihari.com</a> 
        or call us at <span style="font-weight: bold;">9840166419</span>. We're here to help!
    </p>

    <p style="font-size: 16px; color: #333333; margin-top: 30px;">
        Best Regards,
    </p>

    <p style="font-size: 16px; color: #333333;">
        Team <strong>Vanavihari</strong>
    </p>

    <p style="font-size: 16px; color: #333333;">
        info@vanavihari.com | 9840166419
    </p>

</div>
`;

export const RESERVATION_SUCCESS_EMAIL_TEMPLATE =`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    table { width: 100%; max-width: 600px; margin: auto; border-collapse: collapse; }
    th, td { padding: 10px; border: 1px solid #ddd; }
    th { background-color: #4d9900; color: #fff; font-weight: bold; text-align: center; }
    tr:nth-child(even) { background-color: #f8f8f8; }
    tr:nth-child(odd) { background-color: #a3d788; color: #222; }
    h3, h5 { margin: 10px 0; }
  </style>
</head>
<body>

<h3 style="font-style: italic;">Dear {{Full_Name}},</h3>
<h3>Greetings!</h3>
<p>We're thrilled to inform you that your payment has been successfully processed, and your reservation is now confirmed. Below, you'll find the invoice detailing your booking and payment information. Should you require any assistance, please feel free to reach out to our support team at the number provided below.</p>

<table>
  <tr>
    <td style="font-weight:bold;">GST Invoice</td>
    <td>GST Number: 37AAAGD3869B1ZL <br>(Composite scheme)</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">From</td>
    <td>DFO RAMPACHODAVARAM</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Guest Details</td>
    <td>{{Guest_Details}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Booking Date</td>
    <td>{{Reservation_Date}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Booking ID</td>
    <td>{{Booking_Id}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Room Details</td>
    <td>{{Room_List}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Booking Dates</td>
    <td>{{Check_In}} to {{Check_Out}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Total Guests (including children)</td>
    <td>{{Total_Guests}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Total Amount Paid</td>
    <td>{{Payment_Amount}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Transaction ID</td>
    <td>{{Transaction_ID}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Amount Paid On</td>
    <td>{{Payment_Date}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Booking Status</td>
    <td>{{Payment_Status}}</td>
  </tr>
</table>

{% if Food_Providing == "Yes" %}
<h5 style="text-align:center; margin-top:20px; margin-bottom:20px;">Jungle Star Tentative Food Menu</h5>
<table cellpadding="8" cellspacing="0" border="1" style="width:100%; border-collapse: collapse;">
  <thead>
    <tr style="background-color:#4d9900; color:#ffffff; font-weight:bold;">
      <th>Day</th>
      <th>Meal</th>
      <th>Time</th>
      <th>Items</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3" style="text-align:center; font-weight:bold;">Day 1</td>
      <td>Lunch</td>
      <td>1:00 PM to 2:30 PM</td>
      <td>Pulihora (Complimentary), White Rice, Veg. Curry, Egg Curry, Dal, Veg. Fry, Sambar, Curd, Pickle, Papad, Sweet/Banana</td>
    </tr>
    <tr>
      <td>Evening Refreshments</td>
      <td>5:00 PM to 5:30 PM</td>
      <td>Onion Pakoda with Tea</td>
    </tr>
    <tr>
      <td>Dinner</td>
      <td>8:00 PM to 9:00 PM</td>
      <td>Raita, Veg. Dum Biryani, Chicken Curry, Mixed Veg. Curry, White Rice, Curd, Rasam</td>
    </tr>
    <tr>
      <td rowspan="2" style="text-align:center; font-weight:bold;">Day 2</td>
      <td>Morning Refreshments</td>
      <td>6:30 AM at Canteen</td>
      <td>Coffee</td>
    </tr>
    <tr>
      <td>Breakfast</td>
      <td>7:30 AM to 8:30 AM</td>
      <td>Idly, Vada, Tea</td>
    </tr>
  </tbody>
</table>
{% endif %}

<p>Looking forward to welcoming you soon!</p>
<p style="font-weight:bold;">Warm Regards,</p>
<p>
{{Contact_Person_Name}}<br>
Co-ordinator | {{Resort_Name}}<br>
{{Support_Number}}<br>
<a href="mailto:{{Email}}" style="color:#4d1300; font-style:italic;">{{Email}}</a><br>
{{Website}}
</p>

</body>
</html>
`
export const RESERVATION_REFUND_EMAIL_TEMPLATE =`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Cancellation Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f9f9f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 4px; }
    .header { background-color: #4d9900; color: #fff; padding: 10px; text-align: center; border-radius: 4px 4px 0 0; }
    h2 { margin: 0; }
    ul { padding-left: 20px; }
    .highlight { color: rgb(77, 19, 0); font-weight: bold; }
    a { color: #4d9900; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Booking Cancellation Confirmation</h2>
    </div>
    <div class="content" style="padding: 20px;">
      <p>Dear <b>{{Full_Name}}</b>,</p>
      <p>Greetings from Vanavihari Booking System!</p>
      <p>We are writing to confirm that your booking with ID <b>{{Booking_Id}}</b> has been successfully cancelled as requested.</p>
      
      <p><b>Booking Details:</b></p>
      <ul>
        <li>Resort Name: <b>{{Resort_Name}}</b></li>
        <li>Cottage Type(s): <b>{{Cottage_Names}}</b></li>
        <li>Room Name(s): <b>{{Room_Names}}</b></li>
        <li>Reservation Date: <b>{{Reservation_Date}}</b></li>
        <li>Check-in Time: <b>10:00 a.m.</b></li>
        <li>Cancellation Requested Date & Time: <b>{{Cancellation_Request_Date}}</b></li>
      </ul>

      <p>You will receive a refund of <b>Rs {{Refund_Amount}}</b>, which is <b>{{Refund_Percentage}}%</b> of the total amount <b>{{Payment_Amount}}</b>, in your account within 5 to 7 working days. <span class="highlight">Please note that bank charges won't be refunded.</span></p>

      <p><span class="highlight">Refund Policy:</span></p>
      <ul>
        <li>Above 48 hours before check-in: 90% refund</li>
        <li>24-48 hours before check-in: 80% refund</li>
        <li>Within 24 hours: No refund</li>
      </ul>

      <p>Thank you for choosing our services. We hope to serve you again in the future.</p>
      <p>Best regards,</p>

      <p>
        Vanavihari Booking System<br>
        +91 98401 66419<br>
        <a href="http://www.vanavihari.com" target="_blank">www.vanavihari.com</a>
      </p>
    </div>
  </div>
</body>
</html>
`
export const RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE =`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Payment Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f9f9f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 4px; }
    .header { background-color: #4d9900; color: #fff; padding: 10px; text-align: center; border-radius: 4px 4px 0 0; }
    h2, h3 { margin: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    td { padding: 10px; border: 1px solid #ddd; }
    tr:nth-child(even) { background-color: #f8f8f8; }
    tr:nth-child(odd) { background-color: #a3d788; color: #222; }
    a { color: #4d1300; text-decoration: none; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Booking Payment Invoice</h2>
    </div>
    <div class="content" style="padding: 20px;">
      <h3>Dear Vanavihari Coordinator,</h3>
      <h3>Greetings from Vanavihari Booking System!</h3>
      <p>We're thrilled to inform you that your guest's payment has been successfully processed, and the reservation is now confirmed. Below is the invoice detailing the guest's booking and payment information.</p>
      
      <table>
        <tr>
          <td style="font-weight: bold;">Invoice</td>
          <td>GST Number: 37AAAGD3869B1ZL</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">From</td>
          <td>DFO RAMPACHODAVARAM</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Guest Details</td>
          <td>{{Guest_Details}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Booking Date</td>
          <td>{{Reservation_Date}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Booking ID</td>
          <td>{{Booking_Id}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Room Details</td>
          <td>{{Room_List}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Booking Details</td>
          <td>{{Check_In}} to {{Check_Out}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Total Guests (including children)</td>
          <td>{{Total_Guests}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Total Amount Paid</td>
          <td>{{Payment_Amount}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Transaction ID</td>
          <td>{{Transaction_ID}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Amount Paid On</td>
          <td>{{Payment_Date}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Booking Status</td>
          <td>{{Payment_Status}}</td>
        </tr>
      </table>

      <br>
      <p style="font-weight: bold;">Warm Regards,</p>
      <p>
        Vanavihari Booking System<br>
        +91 98401 66419<br>
        <a href="mailto:info@tensketch.com">info@tensketch.com</a>
      </p>
    </div>
  </div>
</body>
</html>

`

export const TENT_RESERVATION_SUCCESS_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tent Booking Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    table { width: 100%; max-width: 600px; margin: auto; border-collapse: collapse; }
    th, td { padding: 10px; border: 1px solid #ddd; }
    th { background-color: #4d9900; color: #fff; font-weight: bold; text-align: center; }
    tr:nth-child(even) { background-color: #f8f8f8; }
    tr:nth-child(odd) { background-color: #a3d788; color: #222; }
    h3, h5 { margin: 10px 0; }
  </style>
</head>
<body>

<h3 style="font-style: italic;">Dear {{Full_Name}},</h3>
<h3>Greetings!</h3>
<p>We're thrilled to inform you that your payment has been successfully processed, and your tent camping reservation is now confirmed. Below, you'll find the invoice detailing your booking and payment information. Should you require any assistance, please feel free to reach out to our support team at the number provided below.</p>

<table>
  <tr>
    <td style="font-weight:bold;">GST Invoice</td>
    <td>GST Number: 37AAAGD3869B1ZL <br>(Composite scheme)</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">From</td>
    <td>DFO RAMPACHODAVARAM</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Guest Details</td>
    <td>{{Guest_Details}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Booking Date</td>
    <td>{{Reservation_Date}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Booking ID</td>
    <td>{{Booking_Id}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Tent Spot</td>
    <td>{{Tent_Spot_Name}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Tent Details</td>
    <td>{{Tent_List}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Booking Dates</td>
    <td>{{Check_In}} to {{Check_Out}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Total Guests</td>
    <td>{{Total_Guests}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Total Children</td>
    <td>{{Total_Children}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Total Amount Paid</td>
    <td>{{Payment_Amount}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Transaction ID</td>
    <td>{{Transaction_ID}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Amount Paid On</td>
    <td>{{Payment_Date}}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;">Booking Status</td>
    <td>{{Payment_Status}}</td>
  </tr>
</table>

<p>Looking forward to welcoming you to our camping site!</p>
<p style="font-weight:bold;">Warm Regards,</p>
<p>
{{Contact_Person_Name}}<br>
Co-ordinator | {{Tent_Spot_Name}}<br>
{{Support_Number}}<br>
<a href="mailto:{{Email}}" style="color:#4d1300; font-style:italic;">{{Email}}</a><br>
{{Website}}
</p>

</body>
</html>
`;

export const TENT_RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tent Booking Payment Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f9f9f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 4px; }
    .header { background-color: #4d9900; color: #fff; padding: 10px; text-align: center; border-radius: 4px 4px 0 0; }
    h2, h3 { margin: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    td { padding: 10px; border: 1px solid #ddd; }
    tr:nth-child(even) { background-color: #f8f8f8; }
    tr:nth-child(odd) { background-color: #a3d788; color: #222; }
    a { color: #4d1300; text-decoration: none; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Tent Booking Payment Invoice</h2>
    </div>
    <div class="content" style="padding: 20px;">
      <h3>Dear Vanavihari Coordinator,</h3>
      <h3>Greetings from Vanavihari Booking System!</h3>
      <p>We're thrilled to inform you that your guest's payment has been successfully processed, and the tent camping reservation is now confirmed. Below is the invoice detailing the guest's booking and payment information.</p>
      
      <table>
        <tr>
          <td style="font-weight: bold;">Invoice</td>
          <td>GST Number: 37AAAGD3869B1ZL</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">From</td>
          <td>DFO RAMPACHODAVARAM</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Guest Details</td>
          <td>{{Guest_Details}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Booking Date</td>
          <td>{{Reservation_Date}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Booking ID</td>
          <td>{{Booking_Id}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Tent Spot</td>
          <td>{{Tent_Spot_Name}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Tent Details</td>
          <td>{{Tent_List}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Booking Details</td>
          <td>{{Check_In}} to {{Check_Out}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Total Guests</td>
          <td>{{Total_Guests}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Total Children</td>
          <td>{{Total_Children}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Total Amount Paid</td>
          <td>{{Payment_Amount}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Transaction ID</td>
          <td>{{Transaction_ID}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Amount Paid On</td>
          <td>{{Payment_Date}}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Booking Status</td>
          <td>{{Payment_Status}}</td>
        </tr>
      </table>

      <br>
      <p style="font-weight: bold;">Warm Regards,</p>
      <p>
        Vanavihari Booking System<br>
        +91 98401 66419<br>
        <a href="mailto:info@tensketch.com">info@tensketch.com</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
