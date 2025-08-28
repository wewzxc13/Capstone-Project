<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

echo "Starting notification format update...\n";

try {
    // Update existing QUARTERLY PROGRESS notifications to standardized format
    $stmt1 = $conn->prepare("
        UPDATE tbl_notifications 
        SET notif_message = '[QUARTERLY PROGRESS] Finalized a Quarterly Progress'
        WHERE notif_message LIKE '%[QUARTERLY PROGRESS]%' 
        AND notif_message LIKE '%Finalized%'
        AND notif_message NOT LIKE '%Finalized a Quarterly Progress%'
    ");
    $stmt1->execute();
    $quarterlyFinalizedCount = $stmt1->rowCount();
    echo "Updated $quarterlyFinalizedCount QUARTERLY PROGRESS Finalized notifications\n";

    $stmt2 = $conn->prepare("
        UPDATE tbl_notifications 
        SET notif_message = '[QUARTERLY PROGRESS] Updated a Quarterly Progress'
        WHERE notif_message LIKE '%[QUARTERLY PROGRESS]%' 
        AND notif_message LIKE '%Updated%'
        AND notif_message NOT LIKE '%Updated a Quarterly Progress%'
    ");
    $stmt2->execute();
    $quarterlyUpdatedCount = $stmt2->rowCount();
    echo "Updated $quarterlyUpdatedCount QUARTERLY PROGRESS Updated notifications\n";

    // Update existing OVERALL PROGRESS notifications to standardized format
    $stmt3 = $conn->prepare("
        UPDATE tbl_notifications 
        SET notif_message = '[OVERALL PROGRESS] Finalized an Overall progress'
        WHERE notif_message LIKE '%[OVERALL PROGRESS]%' 
        AND notif_message LIKE '%Finalized%'
        AND notif_message NOT LIKE '%Finalized an Overall progress%'
    ");
    $stmt3->execute();
    $overallFinalizedCount = $stmt3->rowCount();
    echo "Updated $overallFinalizedCount OVERALL PROGRESS Finalized notifications\n";

    $stmt4 = $conn->prepare("
        UPDATE tbl_notifications 
        SET notif_message = '[OVERALL PROGRESS] Updated an Overall progress'
        WHERE notif_message LIKE '%[OVERALL PROGRESS]%' 
        AND notif_message LIKE '%Updated%'
        AND notif_message NOT LIKE '%Updated an Overall progress%'
    ");
    $stmt4->execute();
    $overallUpdatedCount = $stmt4->rowCount();
    echo "Updated $overallUpdatedCount OVERALL PROGRESS Updated notifications\n";

    // Verify the updates
    $stmt5 = $conn->prepare("
        SELECT 'QUARTERLY PROGRESS Finalized' as type, COUNT(*) as count
        FROM tbl_notifications 
        WHERE notif_message = '[QUARTERLY PROGRESS] Finalized a Quarterly Progress'
        UNION ALL
        SELECT 'QUARTERLY PROGRESS Updated' as type, COUNT(*) as count
        FROM tbl_notifications 
        WHERE notif_message = '[QUARTERLY PROGRESS] Updated a Quarterly Progress'
        UNION ALL
        SELECT 'OVERALL PROGRESS Finalized' as type, COUNT(*) as count
        FROM tbl_notifications 
        WHERE notif_message = '[OVERALL PROGRESS] Finalized an Overall progress'
        UNION ALL
        SELECT 'OVERALL PROGRESS Updated' as type, COUNT(*) as count
        FROM tbl_notifications 
        WHERE notif_message = '[OVERALL PROGRESS] Updated an Overall progress'
    ");
    $stmt5->execute();
    $results = $stmt5->fetchAll(PDO::FETCH_ASSOC);

    echo "\nVerification Results:\n";
    foreach ($results as $row) {
        echo "{$row['type']}: {$row['count']} notifications\n";
    }

    $totalUpdated = $quarterlyFinalizedCount + $quarterlyUpdatedCount + $overallFinalizedCount + $overallUpdatedCount;
    echo "\nTotal notifications updated: $totalUpdated\n";
    echo "Notification format update completed successfully!\n";

    echo json_encode([
        'status' => 'success',
        'message' => 'Notification format update completed successfully',
        'updates' => [
            'quarterly_finalized' => $quarterlyFinalizedCount,
            'quarterly_updated' => $quarterlyUpdatedCount,
            'overall_finalized' => $overallFinalizedCount,
            'overall_updated' => $overallUpdatedCount,
            'total' => $totalUpdated
        ],
        'verification' => $results
    ]);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to update notification format: ' . $e->getMessage()
    ]);
}
?> 