import * as vscode from "vscode";
import * as XMLParser from "fast-xml-parser";

export class XMLOutlineProvider implements vscode.TreeDataProvider<EngineXML>{
  public engine: EngineXML;

  private _onDidChangeTreeData: vscode.EventEmitter<EngineXML | undefined | null | void> = new vscode.EventEmitter<EngineXML | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<EngineXML | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this.engine = this.parseXML();
    this._onDidChangeTreeData.fire();
  }


  constructor(private context: vscode.ExtensionContext) {
    this.engine = this.parseXML();
    vscode.window.onDidChangeActiveTextEditor(e => this.onActiveEditorChanged(e));
    vscode.workspace.onDidChangeTextDocument(e => this.onTextChanged(e));
    this.onActiveEditorChanged(vscode.window.activeTextEditor);
  }

  getTreeItem(element: EngineXML): vscode.TreeItem {
    // vscode.window.showInformationMessage('shits happen on get Tree item');
    return element;
  }

  getChildren(element?: EngineXML): Thenable<EngineXML[]> {
    // vscode.window.showInformationMessage('shits happen on get Children');
    if (element) {
      if (element.child) {
        return Promise.resolve(element.child);
      }
    } else {

      let buffer: EngineXML[] = [];
      buffer.push(this.engine);
      return Promise.resolve(buffer);
    }
    return Promise.resolve([]);
  }



  parseXML(): EngineXML {
    let text: string;
    if (vscode.window.activeTextEditor) {
      text = vscode.window.activeTextEditor?.document.getText();
    } else {
      text = "";
    }

    const option = {
      ignoreAttributes: false,
      allowBooleanAttributes: true,
      preserveOrder: true,
      attributeNamePrefix: "",
      isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => {
        if (isAttribute || isLeafNode) {
          return false;
        }
        return true;
      }
    };
    const parser = new XMLParser.XMLParser(option);
    let obj = parser.parse(text)[0];
    return new EngineXML(obj);
  }

  onActiveEditorChanged(editor?: vscode.TextEditor) {
    if (editor) {
      if (editor.document.languageId === "xml") {
        // console.log("activate view");
        this.activateView();
        this.refresh();
      } else {
        this.deactivateView();
      }
    }
  }
  onTextChanged(event: vscode.TextDocumentChangeEvent) {
    if (event.document === vscode.window.activeTextEditor?.document) {
      if (event.document.languageId === "xml") {
        this.refresh();
      }
    }
  }


  static getXMLTagName(element: object): string {
    let keys = Object.keys(element);
    return keys[0];
  }

  static getXMLId(element: any): string | undefined {
    if (element.attributes === undefined) { return; }
    return element.attributes.Id;
  }

  static getXMLChild(element: any, tagName?: string): object {
    if (tagName !== undefined) {
      return element[tagName];
    }
    return element[this.getXMLTagName(element)];
  }

  activateView() {
    vscode.commands.executeCommand("setContext", "fileIsXML", true);

  }
  deactivateView() {
    vscode.commands.executeCommand("setContext", "fileIsXML", false);
  }

}




class EngineXML extends vscode.TreeItem {
  public child?: EngineXML[];
  public tagName: string;
  public xmlId: string | undefined = undefined;
  constructor(
    private element: any,
  ) {
    super(XMLOutlineProvider.getXMLTagName(element));
    this.tagName = XMLOutlineProvider.getXMLTagName(this.element);
    if (XMLOutlineProvider.getXMLId(element) !== undefined) {
      this.xmlId = XMLOutlineProvider.getXMLId(this.element);
      this.tooltip = `${this.tagName} - ${XMLOutlineProvider.getXMLId(this.element)}`;
      this.description = this.xmlId;
    } else {
      this.tooltip = `${this.tagName}`;
    }
    if (Array.isArray(this.element[this.tagName]) && this.element[this.tagName].length > 0) {
      let buffer: EngineXML[] = [];
      this.element[this.tagName].forEach(function (element: object) {
        buffer.push(new EngineXML(element));
      });
      this.child = buffer;
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }

  }
}

