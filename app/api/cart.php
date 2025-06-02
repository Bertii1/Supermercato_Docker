<?php
// --- Configurazione Iniziale ---
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// --- Impostazioni CORS e Intestazioni HTTP ---
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Origin, X-Requested-With');

// Gestione delle richieste OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Credenziali Database ---
$server = "db";
$dbname = "supermercato";
$login = "admin";
$password = "admin";

$conn = null;

try {
    // --- Connessione al Database ---
    $conn = new mysqli($server, $login, $password, $dbname);
    $conn->set_charset("utf8");

    if ($conn->connect_error) {
        throw new Exception("Connessione al database fallita: " . $conn->connect_error);
    }

    $response = ['status' => 'error', 'message' => 'Endpoint carrello non ancora implementato.'];
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'POST':
            // Aggiungi prodotto al carrello
            $response = ['status' => 'info', 'message' => 'Funzione aggiungi al carrello da implementare.'];
            break;
        case 'GET':
            // Visualizza carrello
            $response = ['status' => 'info', 'message' => 'Funzione visualizza carrello da implementare.'];
            break;
        case 'PUT':
            // Aggiorna quantità prodotto nel carrello
            $response = ['status' => 'info', 'message' => 'Funzione aggiorna quantità carrello da implementare.'];
            break;
        case 'DELETE':
            // Rimuovi prodotto dal carrello
            $response = ['status' => 'info', 'message' => 'Funzione rimuovi dal carrello da implementare.'];
            break;
        default:
            http_response_code(405); // Method Not Allowed
            $response = ['status' => 'error', 'message' => 'Metodo non permesso per il carrello.'];
            break;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Si è verificato un errore del server nella gestione carrello: ' . $e->getMessage()]);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>