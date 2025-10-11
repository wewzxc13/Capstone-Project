<?php
/**
 * Centralized CORS Configuration for Communication Module
 * 
 * This file provides dynamic CORS headers that work with:
 * - Production: learnersville.vercel.app
 * - Local development: localhost:3000, localhost:3001, localhost:3002
 * 
 * Usage: Include at the top of your PHP file after ob_start()
 * include_once 'cors_config.php';
 */

// Dynamic CORS configuration
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'https://learnersville.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
];

if (in_array($origin, $allowedOrigins) || preg_match('/^http:\/\/localhost:3[0-9]{3}$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Note: Access-Control-Allow-Methods should be set in each file based on its needs

