<?php
/**
 * set-session.php
 * Called via POST from JavaScript after successful Supabase authentication.
 * Creates a server-side PHP session with the authenticated user's data.
 */
session_start();
header('Content-Type: application/json');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || empty($data['role'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid session data']);
    exit;
}

// Whitelist allowed roles
$allowed_roles = ['senior', 'merchant', 'osca', 'admin'];
if (!in_array($data['role'], $allowed_roles)) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid role']);
    exit;
}

$_SESSION['role']     = $data['role'];
$_SESSION['username'] = $data['username'] ?? '';
$_SESSION['id']       = $data['id']       ?? '';

echo json_encode(['ok' => true]);
