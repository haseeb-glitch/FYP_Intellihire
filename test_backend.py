import sys
sys.path.insert(0, '.')

try:
    from backend import create_app
    app = create_app()
    print("Backend initialized successfully!")
    
    api_routes = [rule.rule for rule in app.url_map.iter_rules() if rule.rule.startswith("/api")]
    for r in sorted(api_routes):
        print(f"  {r}")
    print(f"\nTotal API routes: {len(api_routes)}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
