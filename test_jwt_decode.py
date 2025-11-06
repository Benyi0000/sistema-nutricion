"""
Script para depurar tokens JWT y verificar qué user_id contienen
"""
import jwt
from datetime import datetime

def decode_jwt_token(token):
    """Decodifica un token JWT sin verificar la firma para ver su contenido"""
    try:
        # Decodificar sin verificar (solo para debugging)
        decoded = jwt.decode(token, options={"verify_signature": False})
        print(f"\n✅ Token decodificado exitosamente:")
        print(f"   user_id: {decoded.get('user_id')}")
        print(f"   token_type: {decoded.get('token_type')}")
        
        # Convertir timestamps a fechas legibles
        if 'exp' in decoded:
            exp_date = datetime.fromtimestamp(decoded['exp'])
            print(f"   expira: {exp_date}")
        
        if 'iat' in decoded:
            iat_date = datetime.fromtimestamp(decoded['iat'])
            print(f"   emitido: {iat_date}")
            
        print(f"\n   Payload completo: {decoded}")
        return decoded
    except jwt.DecodeError as e:
        print(f"\n❌ Error al decodificar token: {e}")
        return None

if __name__ == "__main__":
    print("=" * 70)
    print("DEPURADOR DE TOKENS JWT")
    print("=" * 70)
    print("\nPega el token JWT que estás intentando usar:")
    print("(Busca en localStorage.getItem('access') en la consola del navegador)")
    print()
    
    token = input("Token: ").strip()
    
    if token:
        decode_jwt_token(token)
    else:
        print("❌ No se proporcionó ningún token")
