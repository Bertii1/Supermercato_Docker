<?php
// --- Configurazione Iniziale ---
error_reporting(E_ALL); // Abilita tutti gli errori per il debug (disabilita in produzione)
ini_set('display_errors', 1); // Mostra errori in output (disabilita in produzione)
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log'); // Specifica un file di log

// --- Impostazioni CORS e Intestazioni HTTP ---
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Consente richieste da qualsiasi origine (restringere in produzione)
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'); // Aggiungi tutti i metodi necessari
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

    $response = ['status' => 'error', 'message' => 'Richiesta non gestita.'];
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Recupera prodotti
            $sql = "SELECT codice, descrizione, prezzo, tipo, categoria, calorie FROM prodotti";
            $result = $conn->query($sql);

            if (!$result) {
                throw new Exception("Errore nella query GET: " . $conn->error);
            }

            $prodotti = [];
            while ($row = $result->fetch_assoc()) {
                $prodotti[] = [
                    'codice' => (int)$row['codice'],
                    'descrizione' => $row['descrizione'],
                    'prezzo' => (float)$row['prezzo'],
                    'tipo' => $row['tipo'],
                    'categoria' => $row['categoria'],
                    'calorie' => isset($row['calorie']) ? (int)$row['calorie'] : null
                ];
            }

            if (empty($prodotti)) {
                http_response_code(404);
                $response = ['status' => 'info', 'message' => 'Nessun prodotto trovato.'];
            } else {
                http_response_code(200);
                $response = $prodotti; // Direttamente l'array di prodotti
            }
            break;

        case 'POST':
            // Debug log
            error_log('Received POST data: ' . file_get_contents("php://input"));
            
            $input = json_decode(file_get_contents("php://input"), true);
            
            // Validate JSON parsing
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid JSON data: ' . json_last_error_msg()
                ]);
                break;
            }

            if (!isset($input['descrizione'], $input['prezzo'], $input['tipo'], $input['categoria'])) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Dati mancanti per l\'aggiunta del prodotto'
                ]);
                break;
            }

            // Replace deprecated FILTER_SANITIZE_STRING
            $descrizione = htmlspecialchars(trim($input['descrizione']), ENT_QUOTES, 'UTF-8');
            $prezzo = filter_var($input['prezzo'], FILTER_VALIDATE_FLOAT);
            $tipo = htmlspecialchars(trim($input['tipo']), ENT_QUOTES, 'UTF-8');
            $categoria = htmlspecialchars(trim($input['categoria']), ENT_QUOTES, 'UTF-8');
            $calorie = filter_var($input['calorie'], FILTER_VALIDATE_INT);

            if ($prezzo === false || $prezzo < 0) {
                http_response_code(400);
                $response = ['status' => 'error', 'message' => 'Prezzo non valido.'];
                break;
            }
            if ($calorie === false || $calorie < 0) {
                // Calorie può essere null o un numero intero positivo. Se non è un numero valido, settalo a null.
                $calorie = null;
            }

            $sql = "INSERT INTO prodotti (descrizione, prezzo, tipo, categoria, calorie) VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);

            if ($stmt === false) {
                throw new Exception("Errore nella preparazione della query di inserimento: " . $conn->error);
            }

            $stmt->bind_param("sdssi", $descrizione, $prezzo, $tipo, $categoria, $calorie);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                http_response_code(201); // Created
                $response = ['status' => 'success', 'message' => 'Prodotto aggiunto con successo!', 'id' => $conn->insert_id];
            } else {
                http_response_code(500);
                $response = ['status' => 'error', 'message' => 'Impossibile aggiungere il prodotto.'];
            }
            $stmt->close();
            break;

        case 'PUT':
            // Aggiorna un prodotto esistente
            $input = json_decode(file_get_contents("php://input"), true);

            if (!isset($input['codice'], $input['descrizione'], $input['prezzo'], $input['tipo'], $input['categoria'], $input['calorie'])) {
                http_response_code(400);
                $response = ['status' => 'error', 'message' => 'Dati mancanti per l\'aggiornamento del prodotto.'];
                break;
            }

            $codice = filter_var($input['codice'], FILTER_VALIDATE_INT);
            $descrizione = htmlspecialchars(trim($input['descrizione']), ENT_QUOTES, 'UTF-8');
            $prezzo = filter_var($input['prezzo'], FILTER_VALIDATE_FLOAT);
            $tipo = htmlspecialchars(trim($input['tipo']), ENT_QUOTES, 'UTF-8');
            $categoria = htmlspecialchars(trim($input['categoria']), ENT_QUOTES, 'UTF-8');
            $calorie = filter_var($input['calorie'], FILTER_VALIDATE_INT);

            if ($codice === false || $codice <= 0) {
                http_response_code(400);
                $response = ['status' => 'error', 'message' => 'ID Prodotto non valido per l\'aggiornamento.'];
                break;
            }
            if ($prezzo === false || $prezzo < 0) {
                http_response_code(400);
                $response = ['status' => 'error', 'message' => 'Prezzo non valido.'];
                break;
            }
             if ($calorie === false || $calorie < 0) {
                $calorie = null;
            }


            $sql = "UPDATE prodotti SET descrizione = ?, prezzo = ?, tipo = ?, categoria = ?, calorie = ? WHERE codice = ?";
            $stmt = $conn->prepare($sql);

            if ($stmt === false) {
                throw new Exception("Errore nella preparazione della query di aggiornamento: " . $conn->error);
            }

            $stmt->bind_param("sdssii", $descrizione, $prezzo, $tipo, $categoria, $calorie, $codice);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                http_response_code(200);
                $response = ['status' => 'success', 'message' => 'Prodotto aggiornato con successo!'];
            } else {
                http_response_code(404); // Not Found se il prodotto non esiste
                $response = ['status' => 'info', 'message' => 'Nessun prodotto aggiornato o prodotto non trovato.'];
            }
            $stmt->close();
            break;

        case 'DELETE':
            // Elimina un prodotto
            // Per richieste DELETE, l'ID è spesso passato come parametro nella query string
            $productIdToDelete = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

            if ($productIdToDelete === false || $productIdToDelete <= 0) {
                http_response_code(400);
                $response = ['status' => 'error', 'message' => 'ID Prodotto non valido per l\'eliminazione.'];
                break;
            }

            $sql = "DELETE FROM prodotti WHERE codice = ?";
            $stmt = $conn->prepare($sql);

            if ($stmt === false) {
                throw new Exception("Errore nella preparazione della query di eliminazione: " . $conn->error);
            }

            $stmt->bind_param("i", $productIdToDelete);
            $stmt->execute();

            if ($stmt->affected_rows > 0) {
                http_response_code(200);
                $response = ['status' => 'success', 'message' => 'Prodotto eliminato con successo!'];
            } else {
                http_response_code(404); // Not Found se il prodotto non esiste
                $response = ['status' => 'info', 'message' => 'Nessun prodotto eliminato o prodotto non trovato.'];
            }
            $stmt->close();
            break;

        default:
            http_response_code(405); // Method Not Allowed
            $response = ['status' => 'error', 'message' => 'Metodo non permesso.'];
            break;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);

} catch (Exception $e) {
    // --- Gestione degli Errori Generici ---
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Si è verificato un errore del server: ' . $e->getMessage()]);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>