module.exports = function (RED) {
	'use strict'

	var graphite = require('graphite-udp')

	function GraphiteNode (config) {
		RED.nodes.createNode(this, config)
		var node = this

		node.config = config

		node.client = graphite.createClient({
			host: node.config.host,
			port: node.config.port,
			type: node.config.connType,
			maxPacketSize: node.config.maxPacketSize,
			prefix: node.config.prefix,
			suffix: node.config.suffix,
			verbose: false,
			interval: node.config.interval,
			callback: function (error, metrics) {
				node.send({ error: error, metrics: metrics })
			}
		})

		function send (key, metric) {
			node.client[node.config.add ? 'add' : 'put'](key, metric)
		}

		this.on('input', function (msg) {
			var data = msg.payload
			if (typeof data === 'number')
				send(node.config.defaultMetric, data)
			else if (typeof data === 'string')
				send(node.config.defaultMetric, parseFloat(data))
			else if (typeof data === 'object')
				Object.keys(data).forEach(function (key) {
					var val = data[key]
					if (typeof val === 'number')
						send(key, val)
					else if (typeof val === 'string')
						send(key, parseFloat(val))
				})
		})

		this.on('close', function () {
			node.client.close()
		})
	}

	RED.nodes.registerType('graphite', GraphiteNode)
}
