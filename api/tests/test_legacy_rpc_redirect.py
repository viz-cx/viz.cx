"""node.viz.cx host-scoped 308 redirect (middleware in main.py).

The legacy public VIZ RPC name must 308 to the live node with method, path
and query preserved, while every other Host — including the container-address
Host that kamal-proxy healthchecks send — is untouched.
"""


def test_node_viz_cx_post_redirects_with_path_and_query(client):
    response = client.post(
        "/some/path?foo=bar",
        headers={"Host": "node.viz.cx"},
        follow_redirects=False,
    )
    assert response.status_code == 308
    assert response.headers["location"] == "https://rpc.viz.cx:19443/some/path?foo=bar"


def test_node_viz_cx_with_port_redirects(client):
    response = client.get("/", headers={"Host": "node.viz.cx:443"}, follow_redirects=False)
    assert response.status_code == 308
    assert response.headers["location"] == "https://rpc.viz.cx:19443/"


def test_other_hosts_unaffected(client):
    response = client.get("/", headers={"Host": "api.viz.cx"})
    assert response.status_code == 200
