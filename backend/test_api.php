<?php
// Test the get_user_details.php API
include_once 'connection.php';

try {
    echo "Testing get_user_details.php API...\n";
    
    // Simulate the API call
    $userId = 1; // Your user ID
    
    // Get the user's current role first
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_firstname,
            u.user_middlename,
            u.user_lastname,
            u.user_email,
            u.user_contact_no,
            u.user_birthdate,
            u.user_status,
            u.user_role,
            u.user_photo,
            r.role_name
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_id = ?
    ");
    
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Construct full name
        $fullName = trim($user['user_firstname'] . ' ' . $user['user_middlename'] . ' ' . $user['user_lastname']);
        $fullName = preg_replace('/\s+/', ' ', $fullName); // Remove extra spaces

        // Handle missing role name
        $roleName = $user['role_name'] ?? 'Unknown Role';

        $response = [
            'status' => 'success',
            'user' => [
                'id' => $user['user_id'],
                'firstName' => $user['user_firstname'],
                'middleName' => $user['user_middlename'],
                'lastName' => $user['user_lastname'],
                'fullName' => $fullName,
                'email' => $user['user_email'],
                'contactNo' => $user['user_contact_no'],
                'user_birthdate' => $user['user_birthdate'],
                'role' => $roleName,
                'status' => $user['user_status'],
                'photo' => $user['user_photo'] ? 'http://localhost/capstone-project/backend/Uploads/' . $user['user_photo'] : null
            ]
        ];

        echo "API Response:\n";
        echo json_encode($response, JSON_PRETTY_PRINT);
        echo "\n\n";
        
        echo "Photo field from database: '" . $user['user_photo'] . "'\n";
        echo "Photo field in API response: '" . $response['user']['photo'] . "'\n";
        
    } else {
        echo "❌ User not found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Test failed: " . $e->getMessage() . "\n";
}
?>
