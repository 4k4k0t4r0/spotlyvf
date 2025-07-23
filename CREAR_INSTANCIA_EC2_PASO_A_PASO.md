# 🚀 GUÍA PASO A PASO - Crear Instancia EC2 para Spotlyvf

## ⚠️ IMPORTANTE: Seguridad Primero
**NUNCA compartas tus credenciales de AWS con nadie. Sigue esta guía desde tu propia cuenta.**

---

## 📝 PASO 1: Acceder a AWS Console

1. **Ir a**: https://aws.amazon.com/console/
2. **Iniciar sesión** con tu cuenta AWS
3. **Buscar "EC2"** en la barra de búsqueda
4. **Hacer clic** en "EC2" para abrir el servicio

---

## 🖥️ PASO 2: Lanzar Nueva Instancia

### 2.1 Iniciar el proceso
1. **Hacer clic** en el botón naranja **"Launch Instance"**
2. **Nombre de la instancia**: `spotlyvf-production`

### 2.2 Seleccionar AMI (Sistema Operativo)
```
✅ Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
   - Architecture: 64-bit (x86)
   - Root device type: EBS
   - Virtualization: hvm
```

### 2.3 Seleccionar Tipo de Instancia
```
Para empezar (recomendado):
✅ t3.large (2 vCPU, 8.0 GiB Memory)

Para pruebas (más económico):
✅ t2.micro (1 vCPU, 1.0 GiB Memory) - Free tier eligible
```

### 2.4 Configurar Key Pair
1. **Hacer clic** en "Create new key pair"
2. **Key pair name**: `spotlyvf-key`
3. **Key pair type**: RSA
4. **Private key file format**: .pem
5. **Hacer clic** en "Create key pair"
6. **⚠️ IMPORTANTE**: Se descargará `spotlyvf-key.pem` - ¡Guárdalo en lugar seguro!

---

## 🔒 PASO 3: Configurar Security Group

### 3.1 Crear nuevo Security Group
1. **Seleccionar**: "Create security group"
2. **Security group name**: `spotlyvf-sg`
3. **Description**: `Security group for Spotlyvf application`

### 3.2 Configurar Reglas de Entrada (Inbound Rules)
```
Regla 1 - SSH:
✅ Type: SSH
✅ Protocol: TCP
✅ Port Range: 22
✅ Source: My IP (se auto-detecta tu IP)

Regla 2 - HTTP:
✅ Type: HTTP
✅ Protocol: TCP
✅ Port Range: 80
✅ Source: Anywhere-IPv4 (0.0.0.0/0)

Regla 3 - HTTPS:
✅ Type: HTTPS
✅ Protocol: TCP
✅ Port Range: 443
✅ Source: Anywhere-IPv4 (0.0.0.0/0)

Regla 4 - Django App:
✅ Type: Custom TCP
✅ Protocol: TCP
✅ Port Range: 8000
✅ Source: Anywhere-IPv4 (0.0.0.0/0)
```

---

## 💾 PASO 4: Configurar Storage

### 4.1 Configuración de almacenamiento
```
✅ Volume Type: gp3
✅ Size (GiB): 20
✅ IOPS: 3000 (por defecto)
✅ Throughput (MiB/s): 125 (por defecto)
✅ Encrypted: ❌ (no necesario para empezar)
✅ Delete on termination: ✅ (marcado)
```

---

## 🚀 PASO 5: Revisar y Lanzar

### 5.1 Resumen de configuración
Verificar que todo esté correcto:
```
✅ Name: spotlyvf-production
✅ AMI: Ubuntu Server 24.04 LTS
✅ Instance type: t3.large (o t2.micro)
✅ Key pair: spotlyvf-key
✅ Security group: spotlyvf-sg
✅ Storage: 20 GB gp3
```

### 5.2 Lanzar instancia
1. **Hacer clic** en "Launch Instance"
2. **Esperar** a que aparezca "Successfully initiated launch of instance"
3. **Hacer clic** en "View all instances"

---

## 📍 PASO 6: Configurar Elastic IP

### 6.1 Asignar IP estática
1. **En el menú izquierdo** → "Network & Security" → "Elastic IPs"
2. **Hacer clic** en "Allocate Elastic IP address"
3. **Network Border Group**: Dejar por defecto
4. **Public IPv4 address pool**: Amazon's pool of IPv4 addresses
5. **Hacer clic** en "Allocate"

### 6.2 Asociar IP a la instancia
1. **Seleccionar** la IP recién creada
2. **Actions** → "Associate Elastic IP address"
3. **Resource type**: Instance
4. **Instance**: Seleccionar `spotlyvf-production`
5. **Private IP address**: Dejar por defecto
6. **Hacer clic** en "Associate"

---

## ✅ PASO 7: Verificar Instancia

### 7.1 Estado de la instancia
```
✅ Instance State: Running
✅ Status Checks: 2/2 checks passed
✅ Public IPv4 address: TU_ELASTIC_IP
✅ Private IPv4 address: 172.31.x.x
```

### 7.2 Anotar información importante
```
📝 APUNTA ESTOS DATOS:

🔹 Instance ID: i-xxxxxxxxx
🔹 Public IP (Elastic IP): XXX.XXX.XXX.XXX
🔹 Key Pair Name: spotlyvf-key
🔹 Security Group: spotlyvf-sg
🔹 Region: us-east-1 (o la que hayas seleccionado)
```

---

## 🔑 PASO 8: Preparar Conexión SSH

### 8.1 Configurar permisos del archivo .pem
```powershell
# En Windows con Git Bash o WSL:
chmod 400 spotlyvf-key.pem

# En Windows PowerShell (alternativo):
icacls spotlyvf-key.pem /inheritance:r
icacls spotlyvf-key.pem /grant:r "%username%:R"
```

### 8.2 Probar conexión SSH
```bash
# Reemplazar TU_ELASTIC_IP con tu IP real
ssh -i "spotlyvf-key.pem" ubuntu@TU_ELASTIC_IP
```

**Si funciona**, verás algo como:
```
Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-1009-aws x86_64)
ubuntu@ip-172-31-xx-xx:~$
```

---

## 💰 COSTOS APROXIMADOS

### Con t2.micro (Free Tier):
```
✅ EC2 t2.micro: $0/mes (750 horas gratis)
✅ Elastic IP: $3.65/mes
✅ Storage 20GB: ~$2/mes
💰 Total: ~$5.65/mes
```

### Con t3.large (Recomendado):
```
💵 EC2 t3.large: ~$60/mes
💵 Elastic IP: $3.65/mes
💵 Storage 20GB: ~$2/mes
💰 Total: ~$65/mes
```

---

## 🆘 TROUBLESHOOTING

### ❌ Error: "Permission denied (publickey)"
```bash
# Verificar permisos del archivo .pem
ls -la spotlyvf-key.pem

# Debe mostrar: -r-------- 1 usuario usuario xxx spotlyvf-key.pem
# Si no, ejecutar: chmod 400 spotlyvf-key.pem
```

### ❌ Error: "Connection timed out"
```
1. Verificar que la instancia esté "Running"
2. Verificar que el Security Group tenga puerto 22 abierto
3. Verificar que uses la IP correcta (Elastic IP)
```

### ❌ Error: "Network unreachable"
```
1. Verificar que el Elastic IP esté asociado
2. Esperar 2-3 minutos después de lanzar la instancia
3. Verificar tu conexión a internet
```

---

## ✅ SIGUIENTE PASO

Una vez que tengas la instancia creada y puedas conectarte por SSH, **compárteme**:

1. ✅ **Tu Elastic IP** (XXX.XXX.XXX.XXX)
2. ✅ **Confirmación** de que puedes conectarte por SSH
3. ✅ **Tipo de instancia** que elegiste (t2.micro o t3.large)

Entonces procederemos con la **instalación y configuración** de Spotlyvf en tu servidor.

---

## 🎯 ¿Necesitas ayuda?

Si tienes problemas en algún paso específico, compárteme:
- 📸 **Screenshots** de la pantalla donde te quedaste
- 📝 **Mensajes de error** exactos
- 🔧 **Paso específico** donde tienes dudas

**¡Vamos paso a paso hasta que tengas todo funcionando!** 🚀
