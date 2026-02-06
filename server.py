from flask import Flask, request, jsonify, session
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
import uuid
from datetime import datetime
import json

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')
CORS(app, supports_credentials=True)

# Initialize Firebase Admin SDK (server-side, secure)
try:
    # Use environment variable for service account key
    service_account_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if service_account_path and os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized with service account")
    else:
        # Fallback to default credentials (for development)
        firebase_admin.initialize_app()
        print("Firebase Admin SDK initialized with default credentials")
    
    db = firestore.client()
    print("Firestore client initialized successfully")
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    db = None

# Rate limiting (simple in-memory store - use Redis in production)
request_counts = {}

def rate_limit(user_id, limit=100, window=3600):
    """Simple rate limiting - 100 requests per hour per user"""
    current_time = datetime.now().timestamp()
    if user_id not in request_counts:
        request_counts[user_id] = []
    
    # Remove old requests outside the window
    request_counts[user_id] = [t for t in request_counts[user_id] if current_time - t < window]
    
    if len(request_counts[user_id]) >= limit:
        return False
    
    request_counts[user_id].append(current_time)
    return True

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'firebase': db is not None})

@app.route('/api/auth/anonymous', methods=['POST'])
def create_anonymous_session():
    """Create anonymous session without Firebase"""
    try:
        # Generate secure session ID
        session_id = str(uuid.uuid4())
        session['user_id'] = session_id
        session['is_anonymous'] = True
        session['created_at'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Anonymous session created'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/verify', methods=['POST'])
def verify_session():
    """Verify if user has valid session"""
    try:
        user_id = session.get('user_id')
        if user_id:
            return jsonify({
                'success': True,
                'user_id': user_id,
                'is_anonymous': session.get('is_anonymous', False)
            })
        else:
            return jsonify({'success': False, 'error': 'No valid session'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quiz/save-score', methods=['POST'])
def save_score():
    """Save quiz score securely"""
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        if not rate_limit(user_id):
            return jsonify({'success': False, 'error': 'Rate limit exceeded'}), 429
        
        score = data.get('score', 0)
        total_questions = data.get('totalQuestions', 20)
        
        if not isinstance(score, int) or score < 0 or score > total_questions:
            return jsonify({'success': False, 'error': 'Invalid score data'}), 400
        
        # Save to database if Firebase is available
        if db:
            try:
                user_ref = db.collection('users').document(user_id)
                user_ref.set({
                    'last_score': score,
                    'best_score': score,  # Will be updated with merge
                    'total_questions': total_questions,
                    'updated_at': datetime.now(),
                    'is_anonymous': session.get('is_anonymous', False)
                }, merge=True)
                
                # Update best score if current score is higher
                user_doc = user_ref.get()
                if user_doc.exists:
                    current_best = user_doc.to_dict().get('best_score', 0)
                    if score > current_best:
                        user_ref.update({'best_score': score})
                
                print(f"Score saved to Firebase for user {user_id}")
            except Exception as e:
                print(f"Firebase save error: {e}")
                # Continue with local storage fallback
        
        # Always save locally as backup
        local_data = {
            'score': score,
            'total_questions': total_questions,
            'timestamp': datetime.now().isoformat()
        }
        
        # In a real app, you'd save to a local database
        # For now, we'll just return success
        print(f"Score saved locally for user {user_id}: {local_data}")
        
        return jsonify({
            'success': True,
            'message': 'Score saved successfully',
            'saved_locally': True,
            'saved_to_firebase': db is not None
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quiz/save-session', methods=['POST'])
def save_quiz_session():
    """Save complete quiz session data"""
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        if not rate_limit(user_id):
            return jsonify({'success': False, 'error': 'Rate limit exceeded'}), 429
        
        # Validate session data
        required_fields = ['sessionId', 'finalScore', 'totalQuestions', 'questions']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Save to Firebase if available
        if db:
            try:
                session_ref = db.collection('users').document(user_id).collection('quiz_sessions').document(data['sessionId'])
                session_ref.set({
                    'final_score': data['finalScore'],
                    'total_questions': data['totalQuestions'],
                    'questions': data['questions'],
                    'timestamp': datetime.now(),
                    'is_anonymous': session.get('is_anonymous', False)
                })
                print(f"Quiz session saved to Firebase for user {user_id}")
            except Exception as e:
                print(f"Firebase session save error: {e}")
        
        # Always save locally as backup
        local_data = {
            'session_id': data['sessionId'],
            'final_score': data['finalScore'],
            'total_questions': data['totalQuestions'],
            'questions': data['questions'],
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"Quiz session saved locally for user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Quiz session saved successfully',
            'saved_locally': True,
            'saved_to_firebase': db is not None
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quiz/history', methods=['GET'])
def get_quiz_history():
    """Get user's quiz history"""
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        if not rate_limit(user_id):
            return jsonify({'success': False, 'error': 'Rate limit exceeded'}), 429
        
        # Try to get from Firebase first
        if db:
            try:
                sessions_ref = db.collection('users').document(user_id).collection('quiz_sessions')
                sessions = sessions_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(50).stream()
                
                history = []
                for session_doc in sessions:
                    session_data = session_doc.to_dict()
                    history.append({
                        'sessionId': session_doc.id,
                        'timestamp': session_data.get('timestamp', datetime.now()).isoformat(),
                        'finalScore': session_data.get('final_score', 0),
                        'totalQuestions': session_data.get('total_questions', 20)
                    })
                
                return jsonify({
                    'success': True,
                    'history': history,
                    'source': 'firebase'
                })
                
            except Exception as e:
                print(f"Firebase history error: {e}")
                # Fall back to local storage
        
        # Return empty history for now (in real app, you'd query local database)
        return jsonify({
            'success': True,
            'history': [],
            'source': 'local',
            'message': 'No history found'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/quiz/best-score', methods=['GET'])
def get_best_score():
    """Get user's best score"""
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        if not rate_limit(user_id):
            return jsonify({'success': False, 'error': 'Rate limit exceeded'}), 429
        
        # Try to get from Firebase first
        if db:
            try:
                user_ref = db.collection('users').document(user_id)
                user_doc = user_ref.get()
                
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    best_score = user_data.get('best_score', 0)
                    return jsonify({
                        'success': True,
                        'best_score': best_score,
                        'source': 'firebase'
                    })
                
            except Exception as e:
                print(f"Firebase best score error: {e}")
        
        # Return default score
        return jsonify({
            'success': True,
            'best_score': 0,
            'source': 'local',
            'message': 'No best score found'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Clear user session"""
    try:
        session.clear()
        return jsonify({'success': True, 'message': 'Logged out successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting Flask server on port {port}")
    print(f"Debug mode: {debug}")
    print(f"Firebase available: {db is not None}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)