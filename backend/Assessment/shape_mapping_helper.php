<?php
/**
 * Dynamic Shape Mapping Helper
 * 
 * This helper provides dynamic shape-to-score mappings based on database configuration.
 * This makes the system flexible when shape meanings change (e.g., circle becomes Excellent).
 */

require_once __DIR__ . '/../connection.php';

/**
 * Get dynamic shape-to-score mapping from database
 * 
 * @param PDO $conn Database connection
 * @return array Shape-to-score mapping [shape => score]
 */
function getDynamicShapeMapping($conn) {
    try {
        $stmt = $conn->prepare('
            SELECT visual_feedback_shape, 
                   (min_score + max_score) / 2 as avg_score
            FROM tbl_visual_feedback 
            ORDER BY visual_feedback_id
        ');
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $mapping = [];
        foreach ($rows as $row) {
            $mapping[$row['visual_feedback_shape']] = floatval($row['avg_score']);
        }
        
        return $mapping;
    } catch (Exception $e) {
        error_log("Error getting dynamic shape mapping: " . $e->getMessage());
        // Fallback to default mapping if database fails
        return [
            '♥' => 4.600,   // Heart (Excellent)
            '★' => 3.7995,  // Star (Very Good)
            '◆' => 2.9995,  // Diamond (Good)
            '▲' => 2.1995,  // Triangle (Need Help)
            '⬤' => 1.3995,  // Circle (Not Met)
        ];
    }
}

/**
 * Get dynamic shape-to-score mapping by visual_feedback_id
 * 
 * @param PDO $conn Database connection
 * @return array ID-to-score mapping [visual_feedback_id => score]
 */
function getDynamicShapeMappingById($conn) {
    try {
        $stmt = $conn->prepare('
            SELECT visual_feedback_id, 
                   (min_score + max_score) / 2 as avg_score
            FROM tbl_visual_feedback 
            ORDER BY visual_feedback_id
        ');
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $mapping = [];
        foreach ($rows as $row) {
            $mapping[$row['visual_feedback_id']] = floatval($row['avg_score']);
        }
        
        return $mapping;
    } catch (Exception $e) {
        error_log("Error getting dynamic shape mapping by ID: " . $e->getMessage());
        // Fallback to default mapping if database fails
        return [
            1 => 4.600,   // Heart (Excellent)
            2 => 3.7995,  // Star (Very Good)
            3 => 2.9995,  // Diamond (Good)
            4 => 2.1995,  // Triangle (Need Help)
            5 => 1.3995,  // Circle (Not Met)
        ];
    }
}

/**
 * Get risk level for a given shape
 * 
 * @param string $shape The visual feedback shape
 * @param PDO $conn Database connection
 * @return int Risk level (1=Low, 2=Moderate, 3=High)
 */
function getRiskLevelForShape($shape, $conn) {
    try {
        // Get the visual feedback record to determine risk level
        $stmt = $conn->prepare('
            SELECT visual_feedback_description, 
                   (min_score + max_score) / 2 as avg_score
            FROM tbl_visual_feedback 
            WHERE visual_feedback_shape = ?
        ');
        $stmt->execute([$shape]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            return 3; // Default to High risk if shape not found
        }
        
        $description = strtolower($row['visual_feedback_description']);
        $avgScore = floatval($row['avg_score']);
        
        // Determine risk level based on description and score
        if (strpos($description, 'excellent') !== false || strpos($description, 'very good') !== false || $avgScore >= 4.0) {
            return 1; // Low risk
        } elseif (strpos($description, 'good') !== false || strpos($description, 'need help') !== false || $avgScore >= 2.5) {
            return 2; // Moderate risk
        } else {
            return 3; // High risk
        }
    } catch (Exception $e) {
        error_log("Error getting risk level for shape: " . $e->getMessage());
        // Fallback logic based on shape
        if ($shape === '♥' || $shape === '★') {
            return 1; // Low risk
        } elseif ($shape === '◆' || $shape === '▲') {
            return 2; // Moderate risk
        } else {
            return 3; // High risk
        }
    }
}

/**
 * Get all visual feedback data for dynamic processing
 * 
 * @param PDO $conn Database connection
 * @return array Complete visual feedback data
 */
function getAllVisualFeedbackData($conn) {
    try {
        $stmt = $conn->prepare('
            SELECT visual_feedback_id, 
                   visual_feedback_shape, 
                   visual_feedback_name, 
                   visual_feedback_description,
                   min_score, 
                   max_score,
                   (min_score + max_score) / 2 as avg_score
            FROM tbl_visual_feedback 
            ORDER BY visual_feedback_id
        ');
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log("Error getting visual feedback data: " . $e->getMessage());
        return [];
    }
}

/**
 * Log shape mapping changes for debugging
 * 
 * @param string $context Context where mapping is used
 * @param array $mapping The shape mapping being used
 * @param PDO $conn Database connection
 */
function logShapeMapping($context, $mapping, $conn) {
    $logFile = __DIR__ . '/shape_mapping_debug.txt';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $context - Shape Mapping: " . json_encode($mapping) . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}
?>

