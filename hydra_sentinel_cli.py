import socket
from scapy.all import ARP, Ether, srp

class HydraSentinel:
    """
    MÓDULO DE VIGILÂNCIA DE REDE HYDRA v3.1
    Autoridade Máxima: Dionathan Martins
    """
    def __init__(self):
        self.local_ip = self._get_local_ip()
        self.ip_range = ".".join(self.local_ip.split('.')[:-1]) + ".0/24"

    def _get_local_ip(self):
        """Detecta o IP da interface ativa no sistema."""
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('8.8.8.8', 1))
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
        finally:
            s.close()
        return ip

    def scan(self):
        """Executa varredura ARP para identificar dispositivos conectados."""
        print(f"[HYDRA-SENTINEL] Interface Detectada: {self.local_ip}")
        print(f"[HYDRA-SENTINEL] Escaneando Alvos em: {self.ip_range}")
        print("[HYDRA-SENTINEL] Operação em curso... Aguarde.")

        # Construção do pacote ARP de broadcast
        ether = Ether(dst="ff:ff:ff:ff:ff:ff")
        arp = ARP(pdst=self.ip_range)
        packet = ether/arp

        # Envio e captura de respostas
        result = srp(packet, timeout=3, verbose=0)[0]
        
        devices = []
        for sent, received in result:
            devices.append({'ip': received.psrc, 'mac': received.hwsrc})
        
        return devices

    def display_results(self, devices):
        """Formata e exibe o relatório final para o operador."""
        print("\n" + "="*60)
        print(f"   RELATÓRIO HYDRA - DISPOSITIVOS ATIVOS NA REDE")
        print("="*60)
        print(f"{'ENDEREÇO IP':<20} | {'ENDEREÇO MAC':<20}")
        print("-" * 60)
        
        for device in devices:
            print(f"{device['ip']:<20} | {device['mac']:<20}")
        
        print("-" * 60)
        print(f"TOTAL DE ALVOS IDENTIFICADOS: {len(devices)}")
        print("="*60)

if __name__ == "__main__":
    sentinel = HydraSentinel()
    detected = sentinel.scan()
    sentinel.display_results(detected)