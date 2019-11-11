{% if salt['pillar.get']('dc:mode', 'standalone') == 'standalone' or salt['pillar.get']('dc:mode') == 'primary' %}
{% set mongo_prefix = salt['pillar.get']('mongo') -%}
{% else %}
{% set mongo_prefix = salt['pillar.get']('mongob') -%}
{% endif %}

{% if salt['pillar.get']('PLATFORM_TYPE', 'openstack') == 'openstack' and salt['pillar.get']('mongo_config:bundled', False) == False %}
{% set mongo_sharded = True %}
{% else %}
{% set mongo_sharded = salt['pillar.get']('mongo_sharded', False) %}
{% endif %}

{% if mongo_sharded == True %}
mongo_config:
  clusterA_url: "{{ mongo_prefix }}-mongos-a-0:27018,{{ mongo_prefix }}-mongos-a-1:27018"
  clusterB_url: "{{ mongo_prefix }}-mongos-b-0:27018,{{ mongo_prefix }}-mongos-b-1:27018"
  sharded: True
{% else %}
mongo_config:
  clusterA_url: "{{ mongo_prefix }}-mongod-a-0-0:27017,{{ mongo_prefix }}-mongod-a-1-0:27017,{{ mongo_prefix }}-mongod-a-2-0:27017"
  clusterA_replica_set: "Cluster_A"
  clusterB_url: "{{ mongo_prefix }}-mongod-b-0-0:27017,{{ mongo_prefix }}-mongod-b-1-0:27017,{{ mongo_prefix }}-mongod-b-2-0:27017"
  clusterB_replica_set: "Cluster_B"
  sharded: False
{% endif %}


mongo_cluster_config:
{% if mongo_sharded == True %}
    - native_mongo_A:
        uri_prefix: "mongodb"
        cluster_url: "{{ mongo_prefix }}-mongos-a-0:27018,{{ mongo_prefix }}-mongos-a-1:27018"
        sharded: True
        use_ssl: False
        auth_type: "none"
    - native_mongo_B:
        uri_prefix: "mongodb"
        cluster_url: "{{ mongo_prefix }}-mongos-b-0:27018,{{ mongo_prefix }}-mongos-b-1:27018"
        sharded: True
        use_ssl: False
        auth_type: "none"
{% else %}
    - native_mongo_A:
        uri_prefix: "mongodb"
        cluster_url: "{{ mongo_prefix }}-mongod-a-0-0:27017,{{ mongo_prefix }}-mongod-a-1-0:27017,{{ mongo_prefix }}-mongod-a-2-0:27017"
        replica_set: "Cluster_A"
        sharded: False
        use_ssl: False
        auth_type: "none"
    - native_mongo_B:
        uri_prefix: "mongodb"
        cluster_url: "{{ mongo_prefix }}-mongod-b-0-0:27017,{{ mongo_prefix }}-mongod-b-1-0:27017,{{ mongo_prefix }}-mongod-b-2-0:27017"
        replica_set: "Cluster_B"
        sharded: False
        use_ssl: False
        auth_type: "none"
{% endif %}
    - atlas_A:
        uri_prefix: "mongodb+srv"
        cluster_url: "mongo-atlas-ireland-lkrqx.mongodb.net"
        sharded: False
        use_ssl: True
        auth_type: "SHA-1"
    - aws_docdb_A:
        uri_prefix: "mongodb"
        cluster_url: "docdb-2019-05-27-17-59-38.cluster-czrrzu61r0vr.eu-west-1.docdb.amazonaws.com:27017"
        sharded: False
        use_ssl: True
        auth_type: "SHA-1"

