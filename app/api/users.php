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

    $response = ['status' => 'error', 'message' => 'Endpoint utenti non ancora implementato completamente.'];
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'POST':
            $action = $_GET['action'] ?? null;
            if ($action === 'register') {
                $data = json_decode(file_get_contents('php://input'), true);
                $username = trim($data['username'] ?? '');
                $password = $data['password'] ?? '';

                if (empty($username) || empty($password)) {
                    http_response_code(400);
                    $response = ['status' => 'error', 'message' => 'Username e password sono richiesti'];
                    break;
                }

                // Controlla se l'username è già in uso
                $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
                $check->bind_param("s", $username);
                $check->execute();
                if ($check->get_result()->num_rows > 0) {
                    http_response_code(409); // Conflict
                    $response = ['status' => 'error', 'message' => 'Username già in uso'];
                    break;
                }

                // Crea un nuovo utente
                $password_hash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $conn->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
                $stmt->bind_param("ss", $username, $password_hash);

                if ($stmt->execute()) {
                    $response = [
                        'status' => 'success',
                        'message' => 'Utente registrato con successo'
                    ];
                } else {
                    http_response_code(500);
                    $response = ['status' => 'error', 'message' => 'Errore durante la registrazione'];
                }
            } elseif ($action === 'login') {
                $data = json_decode(file_get_contents('php://input'), true);
                $username = trim($data['username'] ?? '');
                $password = $data['password'] ?? '';

                if (empty($username) || empty($password)) {
                    http_response_code(400);
                    $response = ['status' => 'error', 'message' => 'Username e password sono richiesti'];
                    break;
                }

                // Cerca l'utente nel database
                $stmt = $conn->prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?");
                $stmt->bind_param("s", $username);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows === 0) {
                    http_response_code(401);
                    $response = ['status' => 'error', 'message' => 'Credenziali non valide'];
                    break;
                }

                $user = $result->fetch_assoc();
                
                // Verifica la password
                if (password_verify($password, $user['password_hash'])) {
                    $response = [
                        'status' => 'success',
                        'message' => 'Login effettuato con successo',
                        'role' => $user['role'],
                        'username' => $user['username']
                    ];
                } else {
                    http_response_code(401);
                    $response = ['status' => 'error', 'message' => 'Credenziali non valide'];
                }
            } else {
                http_response_code(400);
                $response = ['status' => 'error', 'message' => 'Azione POST per utenti non specificata o non valida.'];
            }
            break;
        case 'GET':
            // Logica per recuperare dati utente
            $response = ['status' => 'info', 'message' => 'Funzione di recupero dati utente da implementare.'];
            break;
        // Aggiungi case per PUT e DELETE se necessari per la gestione utenti
        default:
            http_response_code(405); // Method Not Allowed
            $response = ['status' => 'error', 'message' => 'Metodo non permesso per gli utenti.'];
            break;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Si è verificato un errore del server nella gestione utenti: ' . $e->getMessage()]);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>