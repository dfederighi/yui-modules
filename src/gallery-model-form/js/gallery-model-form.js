Y.ModelForm = Y.Base.create('model-form', Y.Widget, [], {
    initializer: function(cfg) {
        this._fields = [];
        this._eventHandles = [];
        this._formValues = cfg.values;
        
        /*  Pass in a Y.Model instance instead */
        this.model = new Y.Model({
            testText: '',
            testText2: '',
            testSelect: '',
            testCheckbox: false,
            testSwitch: 0
        });

        this.model.on('change', this._handleModelChange, this);
        this.after('render', Y.bind(this._afterRender, this));
    },
    
    _afterRender: function() {
        this.get('contentBox').setHTML(Y.Node.create(this.get('markup')));
        this._parseFields();
    },
    
    getField: function(name) {
         return this._fields[name];
    },

    _handleModelChange: function(e) {
        if (e.src === 'form') { return; }
 
        Y.Object.each(e.changed, function(obj, key) {
            var field = this.getField(key);
 
            if (!Y.Lang.isUndefined(field)) {
                field.set('value', obj.newVal);
            }

        }, this);
    },

    _parseFields: function() {
        var allFields = this.get('boundingBox').one('form').all('*');
        
        /* add index, nodeList if needed */
        allFields.each(function (node) {
            var nodeName = node.get('nodeName'),
                nodeType = node.get('type');
        
            if (nodeName === 'INPUT') {
                if (nodeType === 'text') {
                    node.after('keyup', function(e) {
                        this.model.set(node.get('name'), e.target.get('value'), {src:'form'});
                    }, this);
                } else if (nodeType === 'checkbox') {
                    node.after('click', function(e) {
                        this.model.set(node.get('name'), e.target.get('checked'), {src:'form'});
                    }, this);
                } else if (nodeType === 'radio') {
                    node.on('change', function(e) {
                        this.model.set(node.get('name'), e.target.get('value'), {src:'form'});
                    }, this);
                }
                
                this._fields[node.get('name')] = node;
            } else if (nodeName === 'SELECT') {
                node.after('change', function(e) {
                    this.model.set(node.get('name'), e.target.get('value'), {src:'form'});
                }, this);

                 this._fields[node.get('name')] = node;
            }
        }, this);

        /* Do we have form values passed in? */
        if (!Y.Object.isEmpty(this._formValues)) {
            this.model.setAttrs(this._formValues);
        }
    }
},
{
    ATTRS: {
        markup: {
            value: ''
        }
    }
});
