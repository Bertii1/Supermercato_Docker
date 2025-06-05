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

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            $username = isset($_GET['username']) ? $_GET['username'] : null;
            if (!$username) {
                throw new Exception("Username non specificato");
            }

            // Ottieni user_id dall'username
            $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $userResult = $stmt->get_result();
            
            if ($userResult->num_rows === 0) {
                throw new Exception("Utente non trovato");
            }
            
            $user = $userResult->fetch_assoc();
            $user_id = $user['id'];

            // Ottieni gli articoli del carrello usando user_id
            $stmt = $conn->prepare("SELECT product_id, quantity FROM carts WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $cart_items = [];
                while ($row = $result->fetch_assoc()) {
                    $cart_items[] = [
                        'product_id' => $row['product_id'],
                        'quantity' => $row['quantity']
                    ];
                }
                $response = ['status' => 'success', 'cart_items' => $cart_items];
            } else {
                $response = ['status' => 'info', 'message' => 'Nessun carrello trovato per questo utente'];
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['username']) || !isset($data['cart_items'])) {
                throw new Exception("Dati del carrello mancanti");
            }

            // Ottieni user_id dall'username
            $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->bind_param("s", $data['username']);
            $stmt->execute();
            $userResult = $stmt->get_result();
            
            if ($userResult->num_rows === 0) {
                throw new Exception("Utente non trovato");
            }
            
            $user = $userResult->fetch_assoc();
            $user_id = $user['id'];

            // Inizia transazione
            $conn->begin_transaction();
            
            try {
                // Pulisci il carrello esistente per l'utente
                $stmt = $conn->prepare("DELETE FROM carts WHERE user_id = ?");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();

                // Inserisci nuovi articoli nel carrello
                if (!empty($data['cart_items'])) {
                    $stmt = $conn->prepare("INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)");
                    
                    foreach ($data['cart_items'] as $item) {
                        $stmt->bind_param("iii", $user_id, $item['product_id'], $item['quantity']);
                        $stmt->execute();
                    }
                }

                $conn->commit();
                $response = ['status' => 'success', 'message' => 'Carrello aggiornato con successo'];
            } catch (Exception $e) {
                $conn->rollback();
                throw $e;
            }
            break;

        default:
            http_response_code(405);
            $response = ['status' => 'error', 'message' => 'Metodo non permesso'];
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