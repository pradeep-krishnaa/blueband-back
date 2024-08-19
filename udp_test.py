# Configure server address and port
SERVER_IP = '0.0.0.0'  # Listen on all available interfaces
SERVER_PORT = 4000    # UDP port number, match this with your Maduino setup

# Create a UDP socket
server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Bind the socket to the server address and port
server_socket.bind((SERVER_IP, SERVER_PORT))

print(f"UDP server is listening on {SERVER_IP}:{SERVER_PORT}...")

while True:
    # Receive data from client
    data, client_address = server_socket.recvfrom(1024)  # Buffer size 1024 bytes
    print(f"Received data from {client_address}: {data.decode()}")

    # Process the received data as needed
    # Example: you can parse and store the data into a database, trigger actions, etc.
    
    # Optionally, send a response back to the client if needed
    # server_socket.sendto(b"Message received", client_address)