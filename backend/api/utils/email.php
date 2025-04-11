<?php
/**
 * Email Utility Class
 * Used for sending various types of emails from the FitZone e-commerce site
 */
class EmailUtil {
    /**
     * Send an order confirmation email to the customer
     * 
     * @param string $recipientEmail Email address of the recipient
     * @param array $orderData Order information (id, items, total, etc)
     * @return boolean Success status of email sending
     */
    public function sendOrderConfirmation($recipientEmail, $orderData) {
        if (empty($recipientEmail) || empty($orderData)) {
            return false;
        }
        
        $orderId = $orderData['order_id'];
        $firstName = $orderData['first_name'] ?? 'Valued Customer';
        $lastName = $orderData['last_name'] ?? '';
        $items = $orderData['items'] ?? [];
        $orderTotal = $orderData['total'] ?? 0;
        
        // Set up email headers
        $to = $recipientEmail;
        $subject = "FitZone - Order Confirmation #$orderId";
        
        // Set headers for HTML email
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: FitZone <noreply@fitzone.com>" . "\r\n";
        
        // Generate order items HTML
        $itemsHtml = '';
        $subtotal = 0;
        
        if (is_array($items) && count($items) > 0) {
            foreach ($items as $item) {
                $name = $item['nom_produit'] ?? $item['product_name'] ?? "Product";
                $price = floatval($item['prix'] ?? $item['price'] ?? 0);
                $quantity = intval($item['quantite'] ?? $item['quantity'] ?? 1);
                $itemTotal = $price * $quantity;
                $subtotal += $itemTotal;
                
                $itemsHtml .= "<tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$name}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>{$quantity}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>\${$price}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>\${$itemTotal}</td>
                </tr>";
            }
        }
        
        // Calculate shipping cost
        $shippingCost = $orderTotal - $subtotal;
        $shippingCost = max(0, $shippingCost); // Ensure it's not negative
        
        // Build email content
        $message = "
        <html>
        <head>
            <title>Order Confirmation</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    line-height: 1.6;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                }
                .header {
                    background-color: #088178;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                .content {
                    padding: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th {
                    background-color: #f2f2f2;
                    padding: 10px;
                    text-align: left;
                }
                .footer {
                    background-color: #f9f9f9;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                }
                .btn {
                    display: inline-block;
                    background-color: #088178;
                    color: white !important;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .total-row {
                    font-weight: bold;
                    background-color: #f9f9f9;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Order Confirmation</h1>
                </div>
                <div class='content'>
                    <p>Dear {$firstName} {$lastName},</p>
                    <p>Thank you for your order! We're processing it now and will notify you when it ships.</p>
                    <p><strong>Order Number:</strong> #{$orderId}</p>
                    <p><strong>Order Date:</strong> " . date('F j, Y') . "</p>
                    
                    <h2>Order Summary</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style='text-align: center;'>Qty</th>
                                <th style='text-align: right;'>Price</th>
                                <th style='text-align: right;'>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {$itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan='3' style='text-align: right; padding: 10px;'><strong>Subtotal:</strong></td>
                                <td style='text-align: right; padding: 10px;'>\${$subtotal}</td>
                            </tr>";
        
        if ($shippingCost > 0) {
            $message .= "
                            <tr>
                                <td colspan='3' style='text-align: right; padding: 10px;'><strong>Shipping:</strong></td>
                                <td style='text-align: right; padding: 10px;'>\${$shippingCost}</td>
                            </tr>";
        }
        
        $message .= "
                            <tr class='total-row'>
                                <td colspan='3' style='text-align: right; padding: 10px;'><strong>Total:</strong></td>
                                <td style='text-align: right; padding: 10px;'>\${$orderTotal}</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <p>You can track your order status by logging into your account.</p>
                    <div style='text-align: center;'>
                        <a href='http://localhost/site-fitness/frontend/orders.html' class='btn'>Track Your Order</a>
                    </div>
                </div>
                <div class='footer'>
                    <p>&copy; " . date('Y') . " FitZone. All rights reserved.</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        // Send the email
        $success = mail($to, $subject, $message, $headers);
        
        // Log success or failure
        if ($success) {
            error_log("Order confirmation email sent successfully to $recipientEmail for order #$orderId");
        } else {
            error_log("Failed to send order confirmation email to $recipientEmail for order #$orderId");
        }
        
        return $success;
    }

    /**
     * Send a password reset email
     * 
     * @param string $recipientEmail Email address of the recipient
     * @param string $resetToken Reset token for password recovery
     * @param string $firstName User's first name
     * @return boolean Success status of email sending
     */
    public function sendPasswordReset($recipientEmail, $resetToken, $firstName = '') {
        if (empty($recipientEmail) || empty($resetToken)) {
            return false;
        }
        
        $to = $recipientEmail;
        $subject = "FitZone - Password Reset Request";
        
        // Set headers for HTML email
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: FitZone <noreply@fitzone.com>" . "\r\n";
        
        $resetLink = "http://localhost/site-fitness/frontend/reset-password.html?token=" . urlencode($resetToken);
        
        // Build email message
        $message = "
        <html>
        <head>
            <title>Password Reset</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    line-height: 1.6;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                }
                .header {
                    background-color: #088178;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                .content {
                    padding: 20px;
                }
                .btn {
                    display: inline-block;
                    background-color: #088178;
                    color: white !important;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer {
                    background-color: #f9f9f9;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Password Reset</h1>
                </div>
                <div class='content'>
                    <p>Hello " . ($firstName ?: 'there') . ",</p>
                    <p>We received a request to reset your password for your FitZone account.</p>
                    <p>To reset your password, click the button below:</p>
                    <div style='text-align: center;'>
                        <a href='{$resetLink}' class='btn'>Reset Password</a>
                    </div>
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    <p>This link will expire in 24 hours.</p>
                </div>
                <div class='footer'>
                    <p>&copy; " . date('Y') . " FitZone. All rights reserved.</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        // Send the email
        return mail($to, $subject, $message, $headers);
    }
}
?>